const mongoose = require('mongoose');
const fs = require('fs');
const { Conversation, JobOffer, Match } = require('../models');
const { getCvPath } = require('../utils/cvStorage');
const { createNotification } = require('../services/notificationService');

function isValidId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

function getUserMatchesFilter(user) {
  return user.role === 'candidate'
    ? { candidateId: user._id }
    : { recruiterId: user._id };
}

async function createMatch(request, response) {
  try {
    if (request.user.role !== 'candidate') {
      return response.status(403).json({ message: 'Seul un candidat peut manifester son intérêt.' });
    }

    if (!isValidId(request.params.jobOfferId)) {
      return response.status(400).json({ message: "Identifiant d'offre invalide." });
    }

    const jobOffer = await JobOffer.findOne({
      _id: request.params.jobOfferId,
      status: 'published',
    });

    if (!jobOffer) {
      return response.status(404).json({ message: 'Offre publiée introuvable.' });
    }

    const match = await Match.create({
      candidateId: request.user._id,
      recruiterId: jobOffer.recruiterId,
      jobOfferId: jobOffer._id,
    });

    await createNotification({
      recipientId: jobOffer.recruiterId,
      actorId: request.user._id,
      type: 'new_match',
      title: 'Nouvelle candidature',
      message: 'Un candidat a manifesté son intérêt pour votre offre.',
      data: { matchId: match._id, jobOfferId: jobOffer._id },
      io: request.app.get('io'),
    });

    return response.status(201).json({
      message: 'Candidature créée avec succès.',
      match,
    });
  } catch (error) {
    if (error.code === 11000) {
      return response.status(409).json({ message: 'Vous avez déjà manifesté votre intérêt pour cette offre.' });
    }

    return response.status(500).json({
      message: 'Erreur lors de la création du match.',
      error: error.message,
    });
  }
}

async function listMatches(request, response) {
  try {
    const matches = await Match.find(getUserMatchesFilter(request.user))
      .populate('jobOfferId')
      .populate('candidateId', 'email role candidateProfile')
      .populate('recruiterId', 'email role recruiterProfile')
      .sort({ createdAt: -1 });

    return response.status(200).json({ matches });
  } catch (error) {
    return response.status(500).json({
      message: 'Erreur lors de la récupération des matchs.',
      error: error.message,
    });
  }
}

async function getCandidateProfileForMatch(request, response) {
  try {
    if (request.user.role !== 'recruiter') {
      return response.status(403).json({ message: 'Seul le recruteur peut consulter le profil du candidat.' });
    }

    if (!isValidId(request.params.id)) {
      return response.status(400).json({ message: 'Identifiant de match invalide.' });
    }

    const match = await Match.findOne({
      _id: request.params.id,
      recruiterId: request.user._id,
    }).populate('candidateId', 'email role candidateProfile');

    if (!match) {
      return response.status(404).json({ message: 'Match introuvable.' });
    }

    return response.status(200).json({
      matchId: match._id,
      status: match.status,
      candidate: match.candidateId,
      cvUrl: match.candidateId.candidateProfile?.cvUrl
        ? `/api/matches/${match._id}/candidate-cv`
        : null,
    });
  } catch (error) {
    return response.status(500).json({
      message: 'Erreur lors de la récupération du profil candidat.',
      error: error.message,
    });
  }
}

async function getCandidateCvForMatch(request, response) {
  try {
    if (request.user.role !== 'recruiter') {
      return response.status(403).json({ message: 'Seul le recruteur peut consulter le CV du candidat.' });
    }

    if (!isValidId(request.params.id)) {
      return response.status(400).json({ message: 'Identifiant de match invalide.' });
    }

    const match = await Match.findOne({
      _id: request.params.id,
      recruiterId: request.user._id,
    }).populate('candidateId', 'candidateProfile');

    if (!match || !match.candidateId.candidateProfile?.cvUrl) {
      return response.status(404).json({ message: 'CV du candidat introuvable.' });
    }

    const cvPath = getCvPath(match.candidateId._id);

    if (!fs.existsSync(cvPath)) {
      return response.status(404).json({ message: 'Fichier CV introuvable.' });
    }

    return response.sendFile(cvPath, { headers: { 'Content-Type': 'application/pdf' } });
  } catch (error) {
    return response.status(500).json({
      message: 'Erreur lors de la récupération du CV candidat.',
      error: error.message,
    });
  }
}

async function updateMatchStatus(request, response) {
  try {
    if (request.user.role !== 'recruiter') {
      return response.status(403).json({ message: 'Seul le recruteur peut traiter une candidature.' });
    }

    if (!isValidId(request.params.id)) {
      return response.status(400).json({ message: 'Identifiant de match invalide.' });
    }

    const { status } = request.body || {};

    if (!['accepted', 'rejected'].includes(status)) {
      return response.status(400).json({ message: 'Le statut doit être accepted ou rejected.' });
    }

    const match = await Match.findOne({
      _id: request.params.id,
      recruiterId: request.user._id,
    });

    if (!match) {
      return response.status(404).json({ message: 'Match introuvable.' });
    }

    match.status = status;
    await match.save();

    let conversation = null;

    if (status === 'accepted') {
      conversation = await Conversation.findOneAndUpdate(
        { matchId: match._id },
        {
          $setOnInsert: {
            matchId: match._id,
            participantIds: [match.candidateId, match.recruiterId],
          },
        },
        { new: true, upsert: true, setDefaultsOnInsert: true }
      );
    }

    await createNotification({
      recipientId: match.candidateId,
      actorId: request.user._id,
      type: status === 'accepted' ? 'match_accepted' : 'match_rejected',
      title: status === 'accepted' ? 'Candidature acceptée' : 'Candidature refusée',
      message: status === 'accepted'
        ? 'Le recruteur a accepté votre candidature.'
        : 'Le recruteur a refusé votre candidature.',
      data: { matchId: match._id, status },
      io: request.app.get('io'),
    });

    return response.status(200).json({
      message: status === 'accepted' ? 'Candidature acceptée.' : 'Candidature refusée.',
      match,
      conversation,
    });
  } catch (error) {
    return response.status(500).json({
      message: 'Erreur lors de la mise à jour du match.',
      error: error.message,
    });
  }
}

module.exports = {
  createMatch,
  listMatches,
  getCandidateProfileForMatch,
  getCandidateCvForMatch,
  updateMatchStatus,
};
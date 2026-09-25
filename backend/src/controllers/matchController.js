const mongoose = require('mongoose');
const { Conversation, JobOffer, Match } = require('../models');

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

module.exports = { createMatch, listMatches, updateMatchStatus };
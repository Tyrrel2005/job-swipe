import { Component } from 'react';
import { Icon } from './UI';
export class ErrorBoundary extends Component {
  state={error:null};
  static getDerivedStateFromError(error){return {error};}
  componentDidCatch(error,details){console.error('JobSwipe interface:',error,details);}
  render(){return this.state.error?<div className="page"><div className="empty-state"><Icon name="error_outline" className="text-red" size={45}/><h3>Un problème d'affichage est survenu</h3><p>Vous pouvez recharger l'application. Vos données restent enregistrées sur le serveur.</p><button className="btn btn-primary" onClick={()=>window.location.reload()}>Recharger</button></div></div>:this.props.children;}
}

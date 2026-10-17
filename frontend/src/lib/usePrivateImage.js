import { useEffect, useState } from 'react';
import { api } from './api';
/** Les médias du backend nécessitent un JWT : ne jamais les injecter comme URL publique. */
export function usePrivateImage(path) {
  const [url,setUrl]=useState(null);
  useEffect(()=>{
    let mounted=true;
    let objectUrl=null;
    setUrl(null);
    if(path) api.blob(path).then(blob=>{
      if(!mounted)return;
      objectUrl=URL.createObjectURL(blob);
      setUrl(objectUrl);
    }).catch(()=>{});
    return ()=>{mounted=false;if(objectUrl)URL.revokeObjectURL(objectUrl)};
  },[path]);
  return url;
}

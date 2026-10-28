import React, {useState} from 'react';
import CatalogAdmin from '../administration/CatalogAdmin';
import KeywordsAdmin from './KeywordsAdmin';

/** Catálogo del panel del administrador: los servicios (S2) y, desde D-94, las palabras clave del buscador. */
export default function CatalogSection() {
  const [tab, setTab] = useState('services');
  return <div className="admin-catalog-section">
    <div className="announcement-tabs client-tabs" role="tablist" aria-label="Secciones del catálogo">
      <button type="button" role="tab" aria-selected={tab === 'services'} onClick={() => setTab('services')}>Servicios</button>
      <button type="button" role="tab" aria-selected={tab === 'keywords'} onClick={() => setTab('keywords')}>Palabras clave</button>
    </div>
    {tab === 'services' ? <CatalogAdmin/> : <KeywordsAdmin/>}
  </div>;
}

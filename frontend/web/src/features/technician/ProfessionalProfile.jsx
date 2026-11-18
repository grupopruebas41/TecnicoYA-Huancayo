import React, {useEffect, useState} from 'react';
import {request} from '../administration/http';
import {initialsOf} from '../client/clientRules';
import {specialtyIcon} from '../client/specialtyIcon';
import Icon from '../panel/icons';
import {Alerts, CountedText, SectionCard, SelectField, Stepper, apiError, useOwnProfile} from './businessCommon';

// D-101: límites del perfil público; «Sobre mí» con 40 caracteres o más completa la tarea del progreso (D-109).
export const LIMITS = {bio: 2000, work_style: 500, warranty_text: 300};
export const BIO_MIN = 40;

/** Doble validación: las mismas reglas que UpdateTechnicianProfileRequest (D-101). */
export function validateProfessional(values, districts = []) {
  const errors = {};
  if (values.bio.length > LIMITS.bio) errors.bio = '«Sobre mí» admite hasta 2000 caracteres.';
  if (values.work_style.length > LIMITS.work_style) errors.work_style = 'La forma de trabajo admite hasta 500 caracteres.';
  if (values.warranty_text.length > LIMITS.warranty_text) errors.warranty_text = 'La garantía admite hasta 300 caracteres.';
  const years = Number(values.experience_years);
  if (values.experience_years === '' || !Number.isInteger(years) || years < 0 || years > 60) errors.experience_years = 'Indica entre 0 y 60 años enteros.';
  if (values.base_district_id && !districts.some(district => district.id === Number(values.base_district_id))) {
    errors.base_district_id = 'Elige un distrito activo.';
  }
  return errors;
}

const fromProfile = profile => ({
  bio: profile?.bio || '', work_style: profile?.work_style || '', warranty_text: profile?.warranty_text || '',
  experience_years: String(profile?.experience_years ?? 0), base_district_id: profile?.base_district_id ? String(profile.base_district_id) : '',
});

/**
 * Vista previa en vivo del perfil público con los datos que se están escribiendo (sin llamar al endpoint público):
 * misma portada por especialidad, avatar, verificado, experiencia y las secciones Sobre mí, Forma de trabajo y Garantía.
 */
export function ProfilePreview({profile, values, user, districts}) {
  const specialty = profile?.declared_subcategories?.[0]?.specialty_name || '';
  const base = districts.find(district => district.id === Number(values.base_district_id))?.name;
  const name = profile?.display_name || user?.name || 'Tu nombre';
  return <aside className="panel-card tech-preview tech-profile-preview" aria-labelledby="tech-profile-preview">
    <p className="kicker" id="tech-profile-preview">Vista previa · así te ven los clientes</p>
    <div className="tech-pp">
      <div className="tech-pp-cover" data-specialty={specialty ? specialtyIcon(specialty) : 'catalog'} aria-hidden="true">
        <Icon name={specialtyIcon(specialty)}/>
      </div>
      <div className="tech-pp-identity">
        <span className="tech-pp-avatar" aria-hidden="true">{initialsOf(name)}</span>
        <div>
          <strong className="tech-pp-name">{name}</strong>
          <p className="tech-pp-chips">
            {profile?.verification_status === 'approved' && <span className="tech-chip"><Icon name="verify"/> Verificado</span>}
            <span className="tech-chip">{Number(values.experience_years) || 0} {Number(values.experience_years) === 1 ? 'año' : 'años'} de experiencia</span>
            {base && <span className="tech-chip"><Icon name="map"/> {base}</span>}
          </p>
        </div>
      </div>
      <div className="tech-pp-block">
        <h4>Sobre mí</h4>
        {values.bio.trim() ? <p>{values.bio}</p> : <p className="muted">Todavía no escribiste «Sobre mí».</p>}
      </div>
      {values.work_style.trim() && <div className="tech-pp-block"><h4>Forma de trabajo</h4><p>{values.work_style}</p></div>}
      {values.warranty_text.trim() && <div className="tech-pp-block"><h4>Garantía</h4><p>{values.warranty_text}</p></div>}
    </div>
    <p className="muted tech-pp-note"><Icon name="lock"/> Tu teléfono, tu correo y tus documentos nunca aparecen en el perfil público.</p>
  </aside>;
}

/** Perfil profesional (Fase T4): una tarjeta por sección, contador de caracteres y vista previa en vivo. */
export default function ProfessionalProfile({user, onSaved}) {
  const own = useOwnProfile();
  const [districts, setDistricts] = useState([]);
  const [values, setValues] = useState(null);
  const [errors, setErrors] = useState({});
  const [notice, setNotice] = useState({});
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    request('/catalog/districts').then(result => setDistricts(Array.isArray(result?.data) ? result.data : [])).catch(() => setDistricts([]));
  }, []);
  useEffect(() => { if (own.data && values === null) setValues(fromProfile(own.data)); }, [own.data, values]);
  const set = (field, value) => { setValues(current => ({...current, [field]: value})); setNotice({}); setErrors(current => ({...current, [field]: undefined})); };

  async function save(event) {
    event.preventDefault();
    const invalid = validateProfessional(values, districts);
    setErrors(invalid);
    if (Object.keys(invalid).length) { setNotice({error: 'Revisa los campos marcados antes de guardar.'}); return; }
    setBusy(true); setNotice({});
    try {
      await request('/technicians/me/profile', {
        bio: values.bio, work_style: values.work_style.trim() || null, warranty_text: values.warranty_text.trim() || null,
        experience_years: Number(values.experience_years), expected_version: own.data.version,
        ...(values.base_district_id ? {base_district_id: Number(values.base_district_id)} : {}),
      }, 'PATCH');
      const fresh = await own.reload();
      setValues(fromProfile(fresh));
      setNotice({success: 'Guardamos tu perfil profesional.'});
      onSaved?.();
    } catch (failure) {
      if (failure?.status === 409) { const fresh = await own.reload(); setValues(fromProfile(fresh)); }
      const fields = failure?.fields || {};
      setErrors(Object.fromEntries(Object.entries(fields).map(([key, list]) => [key, [].concat(list)[0]])));
      setNotice({error: apiError(failure, 'No pudimos guardar tu perfil. Inténtalo de nuevo.')});
    } finally { setBusy(false); }
  }

  return <section className="panel-page tech-page" aria-labelledby="tech-pro-title">
    <header className="client-page-head">
      <h2 id="tech-pro-title">Perfil profesional</h2>
      <p className="muted">Lo que ven los clientes en tu perfil público. Mira a la derecha cómo queda mientras escribes.</p>
    </header>
    {own.error && <p className="error" role="alert">{own.error.message || 'No pudimos cargar tu perfil.'}</p>}
    {!values && !own.error && <div className="panel-card tech-skeleton" role="status">Cargando tu perfil…</div>}
    {values && <div className="tech-availability tech-biz-layout">
      <form className="tech-availability-main" onSubmit={save} noValidate aria-label="Perfil profesional">
        <SectionCard icon="profile" title="Sobre mí" id="pro-about">
          <CountedText dictation label="Cuéntales quién eres y en qué te especializas" name="bio" value={values.bio} max={LIMITS.bio} min={BIO_MIN}
            rows={5} error={errors.bio} onChange={value => set('bio', value)}
            placeholder="Ejemplo: técnico en cómputo con 8 años reparando equipos de oficinas y hogares en Huancayo."/>
        </SectionCard>
        <SectionCard icon="briefcase" title="Forma de trabajo" id="pro-style">
          <CountedText dictation label="Cómo atiendes: diagnóstico, cotización y limpieza" name="work_style" value={values.work_style}
            max={LIMITS.work_style} rows={3} error={errors.work_style} onChange={value => set('work_style', value)}/>
        </SectionCard>
        <SectionCard icon="verify" title="Garantía" id="pro-warranty">
          <CountedText dictation label="Qué garantía ofreces (solo si la ofreces)" name="warranty_text" value={values.warranty_text}
            max={LIMITS.warranty_text} rows={2} error={errors.warranty_text} onChange={value => set('warranty_text', value)}/>
        </SectionCard>
        <SectionCard icon="star" title="Experiencia" id="pro-experience">
          <div className="tech-biz-grid">
            <Stepper label="Años de experiencia" value={values.experience_years} error={errors.experience_years}
              onChange={value => set('experience_years', value)}/>
            <SelectField label="Distrito base" value={values.base_district_id} error={errors.base_district_id}
              hint="Desde dónde sales a atender; suma en la cercanía." onChange={value => set('base_district_id', value)}>
              <option value="">Elige tu distrito base</option>
              {districts.map(district => <option key={district.id} value={district.id}>{district.name}</option>)}
            </SelectField>
          </div>
        </SectionCard>
        <div className="tech-save">
          <Alerts notice={notice}/>
          <button type="submit" className="button primary" disabled={busy} aria-busy={busy}>{busy ? 'Guardando…' : 'Guardar perfil'}</button>
        </div>
      </form>
      <ProfilePreview profile={own.data} values={values} user={user} districts={districts}/>
    </div>}
  </section>;
}

import React, {useState} from 'react';
import {request} from '../administration/http';
import ProfileForm from '../administration/ProfileForm';
import {PasswordField, PasswordMeter} from '../administration/passwordFields';
import {validatePassword} from '../administration/registration';
import {initials} from './PanelShell';
import ClientDetails from '../client/ClientDetails';

const AVATAR_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const AVATAR_BYTES = 5 * 1024 * 1024;
const expired = error => [401, 419, 403].includes(error.status);

/** D-77: foto de perfil subida como media avatar (revisada); sin foto se muestran las iniciales. */
function AvatarCard({user, onUpdate, onExpired}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  async function save(avatarId, message) {
    const result = await request('/me', {avatar_media_id: avatarId, expected_version: user.version}, 'PATCH');
    onUpdate(result.data); setSuccess(message);
  }
  async function choose(event) {
    const file = event.target.files?.[0];
    event.target.value = '';
    setError(''); setSuccess('');
    if (!file) return;
    if (!AVATAR_TYPES.includes(file.type) || file.size > AVATAR_BYTES) { setError('Elige una imagen JPG, PNG o WebP de hasta 5 MB.'); return; }
    setBusy(true);
    try {
      const form = new FormData();
      form.append('purpose', 'avatar');
      form.append('file', file);
      const media = await request('/media', form);
      await save(media.data.id, 'Foto de perfil actualizada.');
    } catch (failure) {
      setError(failure.fields?.file?.[0] || failure.fields?.avatar_media_id?.[0] || failure.message);
      if (expired(failure)) onExpired(failure);
    } finally { setBusy(false); }
  }
  async function remove() {
    setBusy(true); setError(''); setSuccess('');
    try { await save(null, 'Quitamos tu foto de perfil.'); }
    catch (failure) { setError(failure.message); if (expired(failure)) onExpired(failure); }
    finally { setBusy(false); }
  }
  return <section className="panel-card profile-avatar" aria-labelledby="avatar-title">
    <h3 id="avatar-title">Foto de perfil</h3>
    <div className="profile-avatar-row">
      {user.avatar_url ? <img className="profile-avatar-image" src={user.avatar_url} alt={`Foto de ${user.name}`}/>
        : <span className="profile-avatar-image" role="img" aria-label={`Iniciales de ${user.name}`}>{initials(user)}</span>}
      <div>
        <label className="button outline profile-avatar-pick">Elegir foto
          <input type="file" accept={AVATAR_TYPES.join(',')} disabled={busy} onChange={choose}/></label>
        {user.avatar_url && <button type="button" className="text-button" disabled={busy} onClick={remove}>Quitar foto</button>}
        <p className="muted">JPG, PNG o WebP de hasta 5 MB. Se revisa y se quitan sus datos ocultos (EXIF).</p>
      </div>
    </div>
    {error && <p className="error" role="alert">{error}</p>}
    {success && <output className="notice">{success}</output>}
  </section>;
}

/** Cambio de contraseña pidiendo la actual: conserva esta sesión y cierra las demás. */
function PasswordChange({onExpired}) {
  const [values, setValues] = useState({current_password: '', password: '', password_confirmation: ''});
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [busy, setBusy] = useState(false);
  const bind = name => ({value: values[name], onChange: event => setValues(current => ({...current, [name]: event.target.value}))});
  async function submit(event) {
    event.preventDefault();
    if (busy) return;
    const invalid = values.current_password ? {} : {current_password: ['Escribe tu contraseña actual.']};
    Object.assign(invalid, validatePassword(values.password, values.password_confirmation));
    setErrors(invalid); setError(''); setSuccess('');
    if (Object.keys(invalid).length) return;
    setBusy(true);
    try {
      const result = await request('/me/password', values);
      setSuccess(result?.data?.message || 'Tu contraseña se actualizó.');
      setValues({current_password: '', password: '', password_confirmation: ''});
    } catch (failure) {
      setErrors(failure.fields || {}); setError(failure.message);
      if (expired(failure)) onExpired(failure);
    } finally { setBusy(false); }
  }
  return <form className="panel-card profile-password" aria-label="Cambiar contraseña" onSubmit={submit} noValidate aria-busy={busy}>
    <h3>Contraseña</h3>
    <PasswordField name="current_password" label="Contraseña actual" toggleLabel="contraseña actual" errors={errors} autoComplete="current-password" {...bind('current_password')}/>
    <div className="auth-row">
      <PasswordField name="password" label="Nueva contraseña" toggleLabel="nueva contraseña" errors={errors} autoComplete="new-password" {...bind('password')}/>
      <PasswordField name="password_confirmation" label="Confirmar nueva contraseña" toggleLabel="confirmación de la nueva contraseña" errors={errors} autoComplete="new-password" {...bind('password_confirmation')}/>
    </div>
    <PasswordMeter password={values.password}/>
    {error && !Object.keys(errors).length && <p className="error" role="alert">{error}</p>}
    {success && <output className="notice">{success}</output>}
    <button type="submit" className="button primary" disabled={busy}>{busy ? 'Guardando…' : 'Cambiar contraseña'}</button>
  </form>;
}

/** Mi perfil (Fase 1): datos (ProfileForm), foto y contraseña; el cliente suma su distrito y su dirección (D-91). */
export default function ProfilePage({user, onUpdate, onExpired}) {
  return <section className="panel-page profile-page">
    <ProfileForm user={user} onUpdate={onUpdate} onExpired={onExpired}/>
    {user.role?.code === 'client' && <ClientDetails user={user} onUpdate={onUpdate} onExpired={onExpired}/>}
    <AvatarCard user={user} onUpdate={onUpdate} onExpired={onExpired}/>
    <PasswordChange onExpired={onExpired}/>
  </section>;
}

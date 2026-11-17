# Configuración de Supabase y aprovisionamiento de administradores

Guía para el dueño del proyecto. Proyecto: `https://yekanuawkfhdolivbwax.supabase.co`.
**Nunca compartas** la contraseña de la base de datos ni la *secret / service_role key*.

## 1. Aplicar las migraciones (una sola vez)
En Supabase → **SQL Editor** → *New query*, pega y ejecuta **cada archivo en este orden**:

1. `supabase/migrations/20261117000100_core_schema.sql`
2. `supabase/migrations/20261117000200_security.sql`
3. `supabase/migrations/20261117000300_storage.sql`
4. `supabase/migrations/20261117000400_reference_data.sql`

⚠️ **No** ejecutes nada de `supabase/tests/`: eso es solo para pruebas locales.

Comprobación rápida (debe devolver 11):
```sql
select count(*) from public.lp_players;
```

*(Alternativa con la CLI, desde tu computadora: `npx supabase login`,
`npx supabase link --project-ref yekanuawkfhdolivbwax` y `npx supabase db push`. Te pedirá la contraseña de la base
de datos localmente.)*

## 2. Ajustes de autenticación
En **Authentication**:

* **Sign In / Providers → Email:** activado. **Desactiva “Allow new users to sign up”.** Nadie debe poder registrarse solo.
* **Multi-Factor → TOTP:** activado. La redacción exige verificación en dos pasos.
* **URL Configuration:**
  * **Site URL:** `http://localhost:5173` por ahora. Cuando haya dominio, el de producción.
  * **Redirect URLs:** agrega `http://localhost:5173/acceso` y `http://localhost:4173/acceso`, y luego la URL de producción `/acceso`.

## 3. Crear las cuentas (tú y Divilight)
En **Authentication → Users → Add user → Send invitation**, agrega tu correo y el de Divilight.
Crear la cuenta **no** da permisos de redacción: solo el paso 4 lo hace.

## 4. Autorizar a los administradores
En el **SQL Editor** (como `postgres`):
```sql
select private.provision_admin('tu-correo@ejemplo.com', 'Tu nombre');
select private.provision_admin('correo-de-divilight@ejemplo.com', 'Divilight');
```
* Se guarda el **ID inmutable** de cada cuenta (UUID), no el nombre.
* El límite es de **2 administradores activos** (`application_settings.max_admins`).
* Cada alta o baja queda en la bitácora (`security_audit_events`). Ningún usuario puede volverse administrador desde la app.

Para quitar acceso:
```sql
select private.disable_admin('correo@ejemplo.com');
```

## 5. Primer acceso
1. Ejecuta `VITE_DEMO_MODE=false npm run dev` y abre `http://localhost:5173/acceso`.
2. Pide el enlace con tu correo y ábrelo **en el mismo navegador**.
3. Escanea el código QR con tu app de autenticación (Google Authenticator, 1Password, Authy…) y escribe el código de 6 dígitos.
4. Entras a la redacción. El **Centro de Seguridad** muestra tu inicio de sesión.

## Qué protege qué
| Capa | Protección |
|---|---|
| Postgres (RLS) | Toda tabla tiene RLS. `anon` no tiene acceso a ninguna tabla. Solo un admin **con MFA (aal2)** lee o escribe datos editoriales. |
| Worker | `/api/admin/*` llama a `current_admin()` con el token del usuario: 401 (sin sesión válida), 403 `NOT_ADMIN`, 403 `MFA_REQUIRED`. |
| Navegador | Solo tiene la clave **publicable**. La interfaz nunca decide permisos. |

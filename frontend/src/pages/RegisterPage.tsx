import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { loginUser, registerUser } from '@/lib/AuthApi';
import { useAuth } from '@/context/AuthContext';

const SUPPORTER_TYPES = [
  'MonetaryDonor',
  'InKindDonor',
  'Volunteer',
  'SkillsContributor',
  'SocialMediaAdvocate',
  'PartnerOrganization',
] as const;

const RELATIONSHIP_TYPES = ['Local', 'International', 'PartnerOrganization'] as const;
const ACQUISITION_CHANNELS = [
  'Website',
  'SocialMedia',
  'Event',
  'WordOfMouth',
  'PartnerReferral',
  'Church',
] as const;
const STATUSES = ['Active', 'Inactive'] as const;

export default function RegisterPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { refreshAuthState } = useAuth();
  const redirectParam = new URLSearchParams(location.search).get('redirect');
  const safeRedirect = redirectParam && redirectParam.startsWith('/') ? redirectParam : '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [supporterType, setSupporterType] = useState<(typeof SUPPORTER_TYPES)[number]>('MonetaryDonor');
  const [relationshipType, setRelationshipType] = useState<(typeof RELATIONSHIP_TYPES)[number]>('Local');
  const [region, setRegion] = useState('');
  const [country, setCountry] = useState('');
  const [phone, setPhone] = useState('');
  const [status, setStatus] = useState<(typeof STATUSES)[number]>('Active');
  const [acquisitionChannel, setAcquisitionChannel] = useState<(typeof ACQUISITION_CHANNELS)[number]>('Website');
  const [organizationName, setOrganizationName] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [needsSupporterProfile, setNeedsSupporterProfile] = useState(false);

  const requiresOrganizationName =
    needsSupporterProfile && supporterType === 'PartnerOrganization';

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (password !== confirmPassword) {
      setErrorMessage('Passwords must match.');
      return;
    }

    setIsSubmitting(true);

    try {
      await registerUser({
        email,
        password,
        firstName,
        lastName,
        supporterType,
        relationshipType,
        region,
        country,
        phone,
        status,
        acquisitionChannel,
        organizationName: supporterType === 'PartnerOrganization' ? organizationName : null,
      });
      await loginUser(email, password);
      await refreshAuthState();
      setSuccessMessage('Registration succeeded. Redirecting…');
      setNeedsSupporterProfile(false);
      navigate(safeRedirect === '/donor' ? '/donor' : '/');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to register.';
      setErrorMessage(message);
      if (message.toLowerCase().includes('no supporter match found')) {
        setNeedsSupporterProfile(true);
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="max-w-md mx-auto px-6 py-12">
      <h1 className="text-3xl font-semibold mb-2">Create Account</h1>
      <p className="text-muted-foreground mb-6">
        Register for a Safe Harbor account.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="firstName" className="block mb-2 font-medium">
            First Name
          </label>
          <input
            id="firstName"
            type="text"
            className="w-full rounded-md border px-3 py-2"
            value={firstName}
            onChange={(event) => setFirstName(event.target.value)}
            required
          />
        </div>

        <div>
          <label htmlFor="lastName" className="block mb-2 font-medium">
            Last Name
          </label>
          <input
            id="lastName"
            type="text"
            className="w-full rounded-md border px-3 py-2"
            value={lastName}
            onChange={(event) => setLastName(event.target.value)}
            required
          />
        </div>

        <div>
          <label htmlFor="email" className="block mb-2 font-medium">
            Email
          </label>
          <input
            id="email"
            type="email"
            className="w-full rounded-md border px-3 py-2"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </div>

        <div>
          <label htmlFor="password" className="block mb-2 font-medium">
            Password
          </label>
          <input
            id="password"
            type="password"
            className="w-full rounded-md border px-3 py-2"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block mb-2 font-medium">
            Confirm Password
          </label>
          <input
            id="confirmPassword"
            type="password"
            className="w-full rounded-md border px-3 py-2"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            required
          />
        </div>

        {!needsSupporterProfile && (
          <div className="rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-blue-700 text-sm">
            We will first try to match your donor profile by first name, last name, and email.
            If no match is found, we will ask for additional supporter profile details.
          </div>
        )}

        {needsSupporterProfile && (
          <>
            <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-amber-800 text-sm">
              No supporter match found. Please complete the supporter profile fields below, then submit again.
            </div>

            <div>
              <label htmlFor="supporterType" className="block mb-2 font-medium">
                Supporter Type
              </label>
              <select
                id="supporterType"
                className="w-full rounded-md border px-3 py-2"
                value={supporterType}
                onChange={(event) =>
                  setSupporterType(event.target.value as (typeof SUPPORTER_TYPES)[number])
                }
              >
                {SUPPORTER_TYPES.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </div>

            {supporterType === 'PartnerOrganization' && (
              <div>
                <label htmlFor="organizationName" className="block mb-2 font-medium">
                  Organization Name
                </label>
                <input
                  id="organizationName"
                  type="text"
                  className="w-full rounded-md border px-3 py-2"
                  value={organizationName}
                  onChange={(event) => setOrganizationName(event.target.value)}
                  required={requiresOrganizationName}
                />
              </div>
            )}

            <div>
              <label htmlFor="relationshipType" className="block mb-2 font-medium">
                Relationship Type
              </label>
              <select
                id="relationshipType"
                className="w-full rounded-md border px-3 py-2"
                value={relationshipType}
                onChange={(event) =>
                  setRelationshipType(event.target.value as (typeof RELATIONSHIP_TYPES)[number])
                }
              >
                {RELATIONSHIP_TYPES.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="region" className="block mb-2 font-medium">
                Region
              </label>
              <input
                id="region"
                type="text"
                className="w-full rounded-md border px-3 py-2"
                value={region}
                onChange={(event) => setRegion(event.target.value)}
                required
              />
            </div>

            <div>
              <label htmlFor="country" className="block mb-2 font-medium">
                Country
              </label>
              <input
                id="country"
                type="text"
                className="w-full rounded-md border px-3 py-2"
                value={country}
                onChange={(event) => setCountry(event.target.value)}
                required
              />
            </div>

            <div>
              <label htmlFor="phone" className="block mb-2 font-medium">
                Phone
              </label>
              <input
                id="phone"
                type="text"
                className="w-full rounded-md border px-3 py-2"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                required
              />
            </div>

            <div>
              <label htmlFor="status" className="block mb-2 font-medium">
                Status
              </label>
              <select
                id="status"
                className="w-full rounded-md border px-3 py-2"
                value={status}
                onChange={(event) => setStatus(event.target.value as (typeof STATUSES)[number])}
              >
                {STATUSES.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="acquisitionChannel" className="block mb-2 font-medium">
                Acquisition Channel
              </label>
              <select
                id="acquisitionChannel"
                className="w-full rounded-md border px-3 py-2"
                value={acquisitionChannel}
                onChange={(event) =>
                  setAcquisitionChannel(event.target.value as (typeof ACQUISITION_CHANNELS)[number])
                }
              >
                {ACQUISITION_CHANNELS.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </div>
          </>
        )}

        {errorMessage ? (
          <div className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-red-700">
            {errorMessage}
          </div>
        ) : null}

        {successMessage ? (
          <div className="rounded-md border border-green-300 bg-green-50 px-3 py-2 text-green-700">
            {successMessage}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-md bg-black text-white px-4 py-2 disabled:opacity-60"
        >
          {isSubmitting ? 'Creating account...' : 'Register'}
        </button>
      </form>

      <p className="mt-4 text-sm">
        Already have an account?{' '}
        <Link to={`/login?redirect=${encodeURIComponent(safeRedirect)}`} className="underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
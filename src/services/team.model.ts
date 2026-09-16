export const LEGACY_TEAM = 'vedette';
export const IVV_TEAM = '3e50d9da-5e7a-4c3b-ab1a-ec0276b4aa26';

export interface Team {
  id: string;
  name: string;
  logoUrl: string | null;
}

export const DEFAULT_TEAMS: Team[] = [
  { id: LEGACY_TEAM, name: 'Vedette De Remise', logoUrl: '/logo/vedette-logo.jpg' },
  { id: IVV_TEAM, name: 'IVV', logoUrl: null },
];

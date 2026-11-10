// Colors copied from the web app (shared/utils/appColors.js defaults + AuthLayout/Home styles).
// Which app this build is: user, driver (taxi), delivery or restaurant.
const RAW_VARIANT = process.env.EXPO_PUBLIC_APP_VARIANT || 'user';
export const APP_VARIANT = RAW_VARIANT === 'partner' ? 'restaurant' : RAW_VARIANT; // 'partner' = old name

const APP_COLORS = {
  user: { primary: '#F38F24', secondary: '#D97706', label: 'TAXI' },
  driver: { primary: '#FF6B00', secondary: '#D95A00', label: 'DRIVER' },
  delivery: { primary: '#1F9D4B', secondary: '#157A38', label: 'DELIVERY' },
  restaurant: { primary: '#EC4899', secondary: '#BE185D', label: 'RESTAURANT' },
};

const app = APP_COLORS[APP_VARIANT] || APP_COLORS.user;

export const colors = {
  primary: app.primary,
  secondary: app.secondary,
  primarySoft: `${app.primary}1A`,
  appLabel: app.label,

  ink: '#1A1A1A', // auth header, dark buttons
  navy: '#0B172A', // home hero
  amber: '#FBBF24', // brand wordmark
  blue: '#2563EB', // bottom-nav active
  blueSoft: 'rgba(37,99,235,0.10)',

  text: '#111827',
  muted: '#6B7280',
  faint: '#9CA3AF',
  border: '#E5E7EB',
  borderSoft: 'rgba(226,232,240,0.7)',
  bg: '#FFFFFF',
  surface: '#F8F9FA',

  danger: '#EF4444',
  dangerBg: '#FEF2F2',
  success: '#16A34A',
};

export const radius = { sm: 8, md: 12, lg: 16, xl: 24, xxl: 40 };

export const fonts = {
  regular: 'Poppins_400Regular',
  medium: 'Poppins_500Medium',
  semibold: 'Poppins_600SemiBold',
  bold: 'Poppins_700Bold',
  black: 'Outfit_800ExtraBold',
};

// Map CSS-like fontWeight to the loaded Poppins files.
export const fontForWeight = (weight) => {
  const w = String(weight || '400');
  if (w === '800' || w === '900') return fonts.black;
  if (w === '700' || w === 'bold') return fonts.bold;
  if (w === '600') return fonts.semibold;
  if (w === '500') return fonts.medium;
  return fonts.regular;
};

// ---- Super-app verticals (copied from web shared/constants/superAppVerticalTheme.js) ----------
export const EQOSY_LOGO_COLORS = { food: '#FC6C00', taxi: '#1E4A8C', grocery: '#74CC08' };

export const VERTICAL_THEME = {
  food: {
    id: 'food', name: 'EqosyFood',
    accent: EQOSY_LOGO_COLORS.food, activeTab: EQOSY_LOGO_COLORS.food,
    theme: '#B84600', inactiveTab: '#8A3200', inactiveTabBg: 'rgba(138,50,0,0.85)',
    stickyBackdrop: 'rgba(184,70,0,0.92)', accentSoft: '#FFF4EB', accentSoftHover: '#FFE8D6',
  },
  taxi: {
    id: 'taxi', name: 'EqosyTaxi',
    accent: '#5B9BD5', activeTab: '#2563EB',
    theme: '#0B172A', inactiveTab: '#050C16', inactiveTabBg: 'rgba(5,12,22,0.9)',
    stickyBackdrop: 'rgba(11,23,42,0.96)', accentSoft: '#E8EEF7', accentSoftHover: '#D4E2F4',
  },
  grocery: {
    id: 'grocery', name: 'EqosyGrocery',
    accent: EQOSY_LOGO_COLORS.grocery, activeTab: EQOSY_LOGO_COLORS.grocery,
    theme: '#4A8508', inactiveTab: '#2E5505', inactiveTabBg: 'rgba(46,85,5,0.9)',
    stickyBackdrop: 'rgba(74,133,8,0.92)', accentSoft: '#F3FBE8', accentSoftHover: '#E3F5CE',
  },
};

export const VERTICALS = ['food', 'taxi', 'grocery'];
export const getVerticalTheme = (id) => VERTICAL_THEME[id] || VERTICAL_THEME.food;

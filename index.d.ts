import { type Browser } from 'puppeteer-core/lib/Browser';

export const OPERATING_SYSTEMS = {
  win: 'win',
  lin: 'lin',
  mac: 'mac',
  android: 'android',
} as const;
export type OsType = (typeof OPERATING_SYSTEMS)[keyof typeof OPERATING_SYSTEMS];

/**
 * ISO-3166 based proxy location country codes
 */
const PROVIDED_PROXIES = {
  /** Australia */
  AU: "dataCenter:AU",
  /** Argentina */
  AR: "dataCenter:AR",
  /** Brazil */
  BR: "dataCenter:BR",
  /** Canada */
  CA: "dataCenter:CA",
  /** China */
  CN: "dataCenter:CN",
  /** France */
  FR: "dataCenter:FR",
  /** Germany, aka  Deutchland */
  DE: "dataCenter:DE",
  /** India */
  IN: "dataCenter:IN",
  /** Israel */
  IS: "dataCenter:IS",
  /** Italy */
  IT: "dataCenter:IT",
  /** Indonesia */
  ID: "dataCenter:ID",
  /** Netherland */
  NL: "dataCenter:NL",
  /** New Zeland */
  NZ: "dataCenter:NZ",
  /** Poland */
  PL: "dataCenter:PL",
  /** Pakistan */
  PK: "dataCenter:PK",
  /** Spain aka Espana*/
  ES: "dataCenter:ES",
  /** Sweden */
  SE: "dataCenter:SE",
  /** United Kingdom, aka Great Britain */
  GB: "dataCenter:GB",
  /** United States */
  US: "dataCenter:US",
  /** Ukraine */
  UA: "dataCenter:UA",
} as const;
export type ProvidedProxyType = (typeof PROVIDED_PROXIES)[keyof typeof PROVIDED_PROXIES];

type CloudLaunchParams = {
  cloud: true;

  /**
   * Format: 'dataCenter:DE'
   */
  geolocation?: ProvidedProxyType;
};
type LocalLaunchParams = {
  cloud: false;
  headless: boolean;
};

type ExistingProfileLaunchParams = {
  profileId: string;
};
type NewProfileLaunchParams = {
  proxyGeolocation: string;
};

type LaunchParams =
  | CloudLaunchParams
  | LocalLaunchParams
  | ExistingProfileLaunchParams
  | NewProfileLaunchParams
  | {
    /**
     * default delay, 250
     */
    defaultDelay: number;

    /**
     * Operating system
     */
    os: OsType;
  };

type LaunchFn = (params?: LaunchParams) => Promise<{ browser: Browser }>;

type GologinApiType = {
  launch: LaunchFn;
  exit: (status = 0) => Promise<void>;
  delay: (ms: number) => Promise<void>;
};

type GologinApiParams = {
  token: string;
  /**
   * enable debug logging to console.debug
   */
  debug?: boolean;
};

export declare function GologinApi(params: GologinApiParams): GologinApiType;
export declare function exitAll(): Promise<void>;

import puppeteer from 'puppeteer-core';

import { updateProfileProxy } from './browser/browser-api.js';
import GoLogin from './gologin.js';
import { API_URL } from './utils/common.js';

export function getDefaultParams() {
  return {
    token: process.env.GOLOGIN_API_TOKEN,
    profile_id: process.env.GOLOGIN_PROFILE_ID,
    executablePath: process.env.GOLOGIN_EXECUTABLE_PATH,
    autoUpdateBrowser: true,
  };
}

const createLegacyGologin = ({ token, profileId, profile_id, ...params }) => {
  const defaults = getDefaultParams();
  const mergedParams = {
    ...defaults,
    ...params,
    token,
    profile_id: profileId || profile_id || defaults.profile_id,
  };

  return new GoLogin(mergedParams);
};

const createdApis = [];

export const delay = (ms = 250) => new Promise((res) => setTimeout(res, ms));

export function GologinApi({ token, debug: isDebugEnabled }) {
  if (!token) {
    throw new Error('GoLogin API token is missing');
  }

  const debug = isDebugEnabled ? console.debug : () => {};

  const browsers = [];
  const legacyGls = [];

  const httpApi = async (uri, { method = 'POST', json }) => {
    const response = await fetch(`${API_URL}${uri}`, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        'user-agent': 'gologin-api',
        'Content-Type': 'application/json; charset=utf-8',
      },
      body: JSON.stringify(json),
    });
    if (response.status >= 400) {
      console.error(await response.text());
      throw new Error(response.statusText);
    }
    return await response.json();
  };

  const getGeoProxy = async (countryCode = 'DE') => {
    return await httpApi('/users-proxies/mobile-proxy', {
      json: {
        countryCode,
        browserId: '',
        isMobile: false,
        isDC: false,
      },
    });
  };

  const createOrGetProfile = async (params) => {
    if (params?.profileId) {
      debug('Using existing profile', params.profileId);
      return params.profileId;
    }

    const legacyGologin = createLegacyGologin({ token });

    const { id: profileId } = await legacyGologin.quickCreateProfile();

    if (params?.proxy?.countryCode) {
      const countryCode = params.proxy.countryCode;
      const proxy = await getGeoProxy(countryCode);
      debug('Creating profile using provided proxy', {
        countryCode,
        proxy,
      });
      await updateProfileProxy(profileId, token, proxy);
    } else if (params?.proxy) {
      debug('Creating profile based on custom proxy', {
        proxy: params.proxy,
      });
      await updateProfileProxy(profileId, token, proxy);
    }

    return profileId;
  };

  const launchLocal = async (params) => {
    let chromeArgs = params.chromeArgs || [];

    if (params.headless) {
      chromeArgs = chromeArgs.concat(['--headless', '--no-sandbox']);
    }

    const profileId = await createOrGetProfile(params);

    const legacyGologin = createLegacyGologin({
      ...params,
      token,
      profileId,
      extra_params: chromeArgs,
    });

    const started = await legacyGologin.start();
    const browser = await puppeteer.connect({
      browserWSEndpoint: started.wsUrl,
      ignoreHTTPSErrors: true,
    });

    browsers.push(browser);
    legacyGls.push(legacyGologin);

    return { browser };
  };

  const launchCloudProfile = async (params) => {
    const profileParam = params.profileId ? `&profile=${params.profileId}` : '';

    const geolocationParam = params?.proxy?.countryCode
      ? `&geolocation=dataCenter:${params?.proxy?.countryCode}`
      : '';

    const browserWSEndpoint = `https://cloud.gologin.com/connect?token=${token}${profileParam}${geolocationParam}`;
    const browser = await puppeteer.connect({
      browserWSEndpoint,
      ignoreHTTPSErrors: true,
    });

    browsers.push(browser);

    return { browser };
  };

  const launch = async (params = {}) => {
    if (params.cloud) {
      return launchCloudProfile(params);
    }

    return launchLocal(params);
  };

  const page = async (params = {}) => {};

  const api = {
    launch,
    page,
    async exit(status = 0) {
      Promise.allSettled(browsers.map((browser) => browser.close()));
      Promise.allSettled(
        legacyGls.map((gl) => gl.stopLocal({ posting: false })),
      );
      process.exit(status);
    },

    debug,
    delay,
  };

  createdApis.push(api);

  return api;
}

export function exitAll() {
  Promise.allSettled(createdApis.map((api) => api.exit()));
}

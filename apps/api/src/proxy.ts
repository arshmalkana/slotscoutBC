import { EnvHttpProxyAgent, setGlobalDispatcher } from "undici";

/**
 * Behind a proxy (HTTPS_PROXY / NO_PROXY), route the built-in fetch through it. Node 22.21+ can do
 * this itself with NODE_USE_ENV_PROXY=1; older runtimes (the ingest image) need the dispatcher.
 */
if ((process.env.HTTPS_PROXY || process.env.https_proxy) && !process.env.NODE_USE_ENV_PROXY) {
  setGlobalDispatcher(new EnvHttpProxyAgent());
}

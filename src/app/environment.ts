// ================================================================
//  CENTRALIZED API CONFIGURATION
//  Change `useProduction` to switch ALL endpoints at once.
//  Change `LOCAL_IP` or `PROD_IP` to update every URL in the app.
// ================================================================

// ========== SWITCH THIS FLAG TO TOGGLE LOCAL ↔ PRODUCTION ==========
const useProduction = false;

// ========== LOCAL CONFIG ==========
const LOCAL_IP = '10.36.171.105';
const LOCAL_GATEWAY_PORT = '8080';
const LOCAL_COMMUNITY_PORT = '8090';

// ========== PRODUCTION CONFIG ==========
const PROD_IP = 'your-production-ip';
const PROD_GATEWAY_PORT = '8080';
const PROD_COMMUNITY_PORT = '8090';

// ========== COMPUTED (don't touch below) ==========
const IP = useProduction ? PROD_IP : LOCAL_IP;
const GATEWAY_PORT = useProduction ? PROD_GATEWAY_PORT : LOCAL_GATEWAY_PORT;
const COMMUNITY_PORT = useProduction ? PROD_COMMUNITY_PORT : LOCAL_COMMUNITY_PORT;

export const environment = {
  production: useProduction,

  // Base URLs
  gatewayUrl: `http://${IP}:${GATEWAY_PORT}`,
  communityUrl: `http://${IP}:${COMMUNITY_PORT}`,

  // Pre-built API paths
  authApi: `http://${IP}:${GATEWAY_PORT}/api/auth`,
  usersApi: `http://${IP}:${GATEWAY_PORT}/api/users`,
  jobsApi: `http://${IP}:${GATEWAY_PORT}/api/jobs`,
  relocationApi: `http://${IP}:${GATEWAY_PORT}/api/relocation`,
  aiApi: `http://${IP}:${GATEWAY_PORT}/api/ai`,
  communityGroupsApi: `http://${IP}:${COMMUNITY_PORT}/api/community/groups`,
  communityChatApi: `http://${IP}:${COMMUNITY_PORT}/api/community/chat`,
  communityWsUrl: `http://${IP}:${COMMUNITY_PORT}/ws`,
};

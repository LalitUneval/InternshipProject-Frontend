// ================================================================
//  CENTRALIZED API CONFIGURATION
// ================================================================

// ========== SWITCH THIS FLAG TO TOGGLE LOCAL ↔ PRODUCTION ==========
const useProduction = true; 

// ========== LOCAL CONFIG ==========
const LOCAL_IP = '10.144.83.105';
const LOCAL_GATEWAY_PORT = '8080';
const LOCAL_COMMUNITY_PORT = '8090';

// ========== PRODUCTION CONFIG ==========
// Note: No ports needed here as Render handles them via HTTPS (443)
const PROD_GATEWAY_DOMAIN = 'projectbackend-apigateway.onrender.com';
const PROD_COMMUNITY_DOMAIN = 'projectbackend-communityservice.onrender.com'; // Update this when deployed

// ========== COMPUTED LOGIC ==========
const protocol = useProduction ? 'https' : 'http';

const gatewayBase = useProduction 
  ? `${protocol}://${PROD_GATEWAY_DOMAIN}` 
  : `${protocol}://${LOCAL_IP}:${LOCAL_GATEWAY_PORT}`;

const communityBase = useProduction 
  ? `${protocol}://${PROD_COMMUNITY_DOMAIN}` 
  : `${protocol}://${LOCAL_IP}:${LOCAL_COMMUNITY_PORT}`;

export const environment = {
  production: useProduction,

  // Base URLs
  gatewayUrl: gatewayBase,
  communityUrl: communityBase,

  // Pre-built API paths (Pointing through the Gateway)
  authApi: `${gatewayBase}/api/auth`,
  usersApi: `${gatewayBase}/api/users`,
  jobsApi: `${gatewayBase}/api/jobs`,
  relocationApi: `${gatewayBase}/api/relocation`,
  aiApi: `${gatewayBase}/api/ai`,
  
  // Community paths
  communityGroupsApi: `${communityBase}/api/community/groups`,
  communityChatApi: `${communityBase}/api/community/chat`,

communityWsUrl: `${protocol}://${useProduction ? PROD_COMMUNITY_DOMAIN : LOCAL_IP + ':' + LOCAL_COMMUNITY_PORT}/ws`,
};
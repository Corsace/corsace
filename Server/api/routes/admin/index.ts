import { CorsaceRouter } from "../../../corsaceRouter";
import { isCorsace, isLoggedInDiscord } from "../../../../Server/middleware";

const adminRouter  = new CorsaceRouter();

adminRouter.$use(isLoggedInDiscord);
adminRouter.$use(isCorsace);

export default adminRouter;

import rtlPlugin from "stylis-plugin-rtl";
import createCache from "@emotion/cache";
import { prefixer } from "stylis";

export default createCache({
    key: "muirtl",
    stylisPlugins: [prefixer, rtlPlugin]
});
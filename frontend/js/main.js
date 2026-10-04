// Diem vao cua frontend: khoi tao tung phan. Moi feature export init() va khong import feature khac.

import { initSidebar } from "./core/sidebar.js";
import { initTabs } from "./core/tabs.js";
import { initAddWord } from "./features/add-word/index.js";
import { initCategories } from "./features/categories/index.js";
import { initStudy } from "./features/study/index.js";
import { initSettings } from "./features/settings/index.js";

initTabs();
initSidebar();
initAddWord();
initCategories();
initStudy();
initSettings();

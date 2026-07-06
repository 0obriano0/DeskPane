import { createApp } from 'vue'
import App from './App.vue'
import { i18n } from './i18n'

import '@deskpane/styles/deskpane.css'
import '@deskpane/styles/deskpane-desktop.css'
import '@deskpane/styles/deskpane-layout.css'
import '@deskpane/styles/deskpane-workspace.css'
import '@deskpane/styles/deskpane-taskview.css'

createApp(App).use(i18n).mount('#app')

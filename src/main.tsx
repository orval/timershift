import { render } from 'preact'
import App from './App'
import './index.css'
import { applyTheme, getInitialTheme } from './utils/theme'

applyTheme(getInitialTheme())

render(<App />, document.getElementById('root')!)

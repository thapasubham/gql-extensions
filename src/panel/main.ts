import { mount } from 'svelte';
import App from './App.svelte';
import { store } from './store.svelte';
import './app.css';

document.documentElement.dataset.theme = chrome.devtools.panels.themeName === 'dark' ? 'dark' : 'light';

window.attachSink = () => store;

mount(App, { target: document.getElementById('app')! });

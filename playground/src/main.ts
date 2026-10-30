import { mount } from "svelte";
import "@telaion/ui/tokens.css";
import "./playground.css";
import App from "./App.svelte";

mount(App, { target: document.getElementById("app")! });

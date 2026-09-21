// The ported legacy modules still read three.js from a global `THREE`.
// This module must be imported first. It goes away when the renderer is rewritten (Phase 3).
import * as THREE from 'three';
/* Proper colour management is on: colours are sRGB in code and converted for lighting. */
THREE.ColorManagement.enabled = true;
(window as any).THREE = THREE;

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Draggable } from 'gsap/Draggable';
import { InertiaPlugin } from 'gsap/InertiaPlugin';
import { useGSAP } from '@gsap/react';

// Register once. Importing this module anywhere guarantees plugins are ready.
gsap.registerPlugin(useGSAP, ScrollTrigger, Draggable, InertiaPlugin);

gsap.defaults({ ease: 'power3.out', duration: 0.9 });
ScrollTrigger.config({ ignoreMobileResize: true });

export { gsap, ScrollTrigger, Draggable, InertiaPlugin, useGSAP };

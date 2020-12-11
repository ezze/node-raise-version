#!/usr/bin/env node
import raiseVersion from './raiseVersion';

raiseVersion().catch(e => console.error(e));

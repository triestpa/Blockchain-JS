#!/bin/bash
cd ./node_modules/sjcl && \
 ./configure --with-ecc && \
 make sjcl.js
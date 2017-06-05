#!/bin/bash

pwd=`pwd`
mkdir /tmp/hostsetc-build
mkdir ./build
cp -rf ./* /tmp/hostsetc-build
cd /tmp/hostsetc-build
enclose --loglevel info -c config.js -o $pwd/build/server ./index.js
cd $PWD
rm -rf /tmp/hostsetc-build
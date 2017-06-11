#!/bin/bash

SWD=`pwd`
echo "Nuking Build Directories"
rm -rvf /tmp/hostsetc-build
rm -rvf ../build
echo "Creating Build Directories"
mkdir /tmp/hostsetc-build
mkdir /tmp/hostsetc-build/server
mkdir /tmp/hostsetc-build/gui
mkdir /tmp/hostsetc-build/launcher
mkdir ../build
mkdir ../build/gui
echo "Building API Server"
cp -rf ../hosts-server/* /tmp/hostsetc-build/server
cd /tmp/hostsetc-build/server
enclose --loglevel info -c config.js -o "$SWD/../build/server" ./index.js
cd $SWD
echo "Build Complete"
echo "Building GUI"
cp -rf ../gui/* /tmp/hostsetc-build/gui
cd /tmp/hostsetc-build/gui
mkdir build
electron-packager ./ HostsETC --platform=darwin --icon=./icons/darwin.icns --out=build
cd build
cd HostsETC-darwin-x64
cp -rf HostsETC.app $SWD/../build/gui/
echo "GUI Build Complete"
echo "Staging Launcher"
cd $SWD
cp -rf ../src/mac/HostsETC\ Launcher/* /tmp/hostsetc-build/launcher
cp ../build/server /tmp/hostsetc-build/launcher/HostsETC\ Launcher/server
cp -rf ../build/gui/HostsETC.app /tmp/hostsetc-build/launcher/HostsETC\ Launcher/
cd /tmp/hostsetc-build/launcher/
xcodebuild -archivePath HostsETC -scheme HostsETC\ Launcher archive

# Can't export as MacApp, will just take the app out of the archive

#echo "{\"method\":\"development\"}" | plutil -convert xml1 -o ./exportOptions.plist -- -

#xcodebuild -exportArchive -archivePath HostsETC.xcarchive -exportPath HostsETC.app -exportOptionsPlist exportOptions.plist
cd HostsETC.xcarchive/Products/Applications
cp -rf HostsETC\ Launcher.app $SWD/../build/

cd $SWD

cd ../build/

mv HostsETC\ Launcher.app HostsETC.app

zip -r HostsETC-Darwin.zip HostsETC.app

echo "Build Complete!"
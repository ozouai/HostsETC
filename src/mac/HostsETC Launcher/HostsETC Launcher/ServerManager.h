//
//  ServerManager.h
//  HostsETC Launcher
//
//  Created by Omar Zouai on 6/4/17.
//  Copyright © 2017 Omar Zouai. All rights reserved.
//

#import <Foundation/Foundation.h>
#import <Cocoa/Cocoa.h>
@interface ServerManager : NSObject {
@public
    BOOL restrictHosts;
    NSString *port;
    NSString *listenHost;
@private
    BOOL running;
    AuthorizationRef authorizationRef;
    BOOL authorized;
    FILE *outputFile;
    //NSTask *gui;
    NSRunningApplication* gui;
}
+(ServerManager*) getInstance;

-(void)requestAuthorization;
-(void)launchServer;
-(void)terminateServer;
-(BOOL) checkPipe;
-(BOOL)isRunning;
-(void)launchGUI;
@end

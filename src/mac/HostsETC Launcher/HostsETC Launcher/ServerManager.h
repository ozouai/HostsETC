//
//  ServerManager.h
//  HostsETC Launcher
//
//  Created by Omar Zouai on 6/4/17.
//  Copyright © 2017 Omar Zouai. All rights reserved.
//

#import <Foundation/Foundation.h>

@interface ServerManager : NSObject {
@public BOOL restrictHosts;
@private
    BOOL running;
    AuthorizationRef authorizationRef;
    BOOL authorized;
    FILE *outputFile;
}
+(ServerManager*) getInstance;

-(void)requestAuthorization;
-(void)launchServer;
-(void)terminateServer;
-(BOOL)isRunning;
@end

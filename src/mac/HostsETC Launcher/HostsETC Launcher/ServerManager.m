//
//  ServerManager.m
//  HostsETC Launcher
//
//  Created by Omar Zouai on 6/4/17.
//  Copyright © 2017 Omar Zouai. All rights reserved.
//

#import "ServerManager.h"

@implementation ServerManager
static ServerManager* sharedInstance;
+(ServerManager*) getInstance {
    if(sharedInstance == nil) {
        sharedInstance = [[ServerManager alloc] init];
    }
    return sharedInstance;
}
-(id)init {
    running = NO;
    authorized = NO;
    return self;
}
-(BOOL) isRunning {
    return running;
}
-(void)terminateServer {
    fclose(outputFile);
    running = NO;
}
-(void)launchServer {
    if(!authorized) {
        [self requestAuthorization];
    }
    NSString *tempPassFile = [NSString stringWithFormat:@"%@%@", @"/tmp/",[[NSProcessInfo processInfo] globallyUniqueString]];
    [[NSFileManager defaultManager] createFileAtPath:tempPassFile contents:nil attributes:nil];
    [[[NSProcessInfo processInfo] globallyUniqueString] writeToFile:tempPassFile atomically:YES encoding:NSUTF8StringEncoding error:nil];
    
    NSString *argr = [NSString stringWithFormat:@"%@%@", @"-passFile:", tempPassFile];
    NSString *restrictedArg = @"";
    if(restrictHosts) restrictedArg = @"-restricted";
    char *args[] = {"/Users/omar/WebstormProjects/HostsETC/hosts-server/index.js", [argr UTF8String] , [restrictedArg UTF8String], NULL};
    OSStatus status2 = AuthorizationExecuteWithPrivileges(authorizationRef, "/usr/local/bin/node", kAuthorizationFlagDefaults, args, &outputFile);
    running = YES;
}
-(void) requestAuthorization {
    AuthorizationItem authItem      = { "", 0, NULL, 0 };
    AuthorizationRights authRights  = { 1, &authItem };
    AuthorizationFlags flags        =   kAuthorizationFlagDefaults              |
    kAuthorizationFlagInteractionAllowed    |
    kAuthorizationFlagPreAuthorize          |
    kAuthorizationFlagExtendRights;
    
    OSStatus status = AuthorizationCreate(&authRights, kAuthorizationEmptyEnvironment, flags, &authorizationRef);
    status = AuthorizationCopyRights(authorizationRef, &authRights, kAuthorizationEmptyEnvironment, flags, NULL);
    authorized = YES;
}
@end

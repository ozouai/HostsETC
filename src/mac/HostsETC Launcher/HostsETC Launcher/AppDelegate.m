//
//  AppDelegate.m
//  HostsETC Launcher
//
//  Created by Omar Zouai on 6/3/17.
//  Copyright © 2017 Omar Zouai. All rights reserved.
//

#import "AppDelegate.h"

@interface AppDelegate ()

@end

@implementation AppDelegate

- (void)applicationDidFinishLaunching:(NSNotification *)aNotification {
    AuthorizationRef authorizationRef = NULL;
    
    AuthorizationItem authItem      = { "", 0, NULL, 0 };
    AuthorizationRights authRights  = { 1, &authItem };
    AuthorizationFlags flags        =   kAuthorizationFlagDefaults              |
    kAuthorizationFlagInteractionAllowed    |
    kAuthorizationFlagPreAuthorize          |
    kAuthorizationFlagExtendRights;
    
    OSStatus status = AuthorizationCreate(&authRights, kAuthorizationEmptyEnvironment, flags, &authorizationRef);
    status = AuthorizationCopyRights(authorizationRef, &authRights, kAuthorizationEmptyEnvironment, flags, NULL);

    
    FILE *outputFile;
    
    NSString *tempPassFile = [NSString stringWithFormat:@"%@%@", @"/tmp/",[[NSProcessInfo processInfo] globallyUniqueString]];
    
    [[NSFileManager defaultManager] createFileAtPath:tempPassFile contents:nil attributes:nil];
    [[[NSProcessInfo processInfo] globallyUniqueString] writeToFile:tempPassFile atomically:YES encoding:NSUTF8StringEncoding error:nil];
    
    NSString *argr = [NSString stringWithFormat:@"%@%@", @"-passFile:", tempPassFile];
    
    char *args[] = {"/Users/omar/WebstormProjects/HostsETC/hosts-server/index.js", [argr UTF8String] , NULL};
    OSStatus status2 = AuthorizationExecuteWithPrivileges(authorizationRef, "/usr/local/bin/node", kAuthorizationFlagDefaults, args, &outputFile);
    
    //AuthorizationFree(authorizationRef, flags);
    
    
}


- (void)applicationWillTerminate:(NSNotification *)aNotification {
    // Insert code here to tear down your application
}


@end

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
    restrictHosts = YES;
    port = @"5002";
    listenHost = @"localhost";
    outputFile = NULL;
    return self;
}
-(BOOL) isRunning {
    return running;
}
-(void)terminateServer {
    fclose(outputFile);
    if(gui != nil) [gui forceTerminate];
    running = NO;
}
-(BOOL)checkPipe {
    if(outputFile == NULL) return NO;
    return fcntl(fileno(outputFile), F_GETFD) == 0;
}
-(void)launchServer {
    if(!authorized) {
        [self requestAuthorization];
    }
    NSString *token =[[NSProcessInfo processInfo] globallyUniqueString];
    
    NSString *exec = [[[NSBundle mainBundle] resourcePath] stringByAppendingPathComponent:@"server"];
    
    
    NSString *restrictedArg = @"";
    if(restrictHosts) restrictedArg = @"-restricted";
    
    NSString *portArg = [NSString stringWithFormat:@"-port:%@",port];
    NSString *listenArg = [NSString stringWithFormat:@"-listen:%@",listenHost];
    
    char *args[] = {[restrictedArg UTF8String], [portArg UTF8String], [listenArg UTF8String], NULL};
    OSStatus status2 = AuthorizationExecuteWithPrivileges(authorizationRef, [exec UTF8String], kAuthorizationFlagDefaults, args, &outputFile);
    running = YES;
    [self launchGUI];
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
-(void) launchGUI {
    //gui = [NSTask new];
    NSArray *args = [NSArray arrayWithObjects:[NSString stringWithFormat:@"-port:%@", port], nil];
    NSURL *url = [NSURL fileURLWithPath:[[[NSBundle mainBundle] resourcePath] stringByAppendingPathComponent:@"HostsETC.app"]];
    
    
    gui = [[NSWorkspace sharedWorkspace] launchApplicationAtURL:url options:0 configuration:[NSDictionary dictionaryWithObject:args forKey:NSWorkspaceLaunchConfigurationArguments] error:nil];
    [NSTimer scheduledTimerWithTimeInterval:1.0f target:self selector:@selector(checkGUIStatus:) userInfo:nil repeats:YES];
}
-(void)checkGUIStatus:(NSTimer*)timer {
    if(gui == nil) return;
    if(gui.terminated) {
        [self terminateServer];
        [NSApp performSelector:@selector(terminate:) withObject:nil afterDelay:1.0f];
    }
}
@end

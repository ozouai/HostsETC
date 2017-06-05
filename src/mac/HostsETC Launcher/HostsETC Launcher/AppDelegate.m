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
    
    self.statusItem = [[NSStatusBar systemStatusBar] statusItemWithLength:NSVariableStatusItemLength];
    _statusItem.image = [NSImage imageNamed:@"statusItem.tiff"];
    [_statusItem.image setTemplate:NO];
    
    _statusMenu = [[NSMenu alloc] initWithTitle:@"HostsETC"];
    [_statusMenu addItem:[[NSMenuItem alloc] initWithTitle:@"HostsETC" action:nil keyEquivalent:@""]];
    
    [_statusMenu addItem:[NSMenuItem separatorItem]];
    
    [_statusMenu addItem:[[NSMenuItem alloc] initWithTitle:@"Edit Launcher Config" action:@selector(configClicked:) keyEquivalent:@""]];
    
    [_statusMenu addItem:[NSMenuItem separatorItem]];
    
    [_statusMenu addItem:[[NSMenuItem alloc] initWithTitle:@"Exit" action:@selector(exitClicked:) keyEquivalent:@""]];
    
    [_statusItem setMenu:_statusMenu];
    
    
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

-(void) configClicked:(id)sender {
    NSLog(@"Hello");
    NSStoryboard *storyboard = [NSStoryboard storyboardWithName:@"Main" bundle:[NSBundle mainBundle]];
    
    NSWindowController *vc = [storyboard instantiateInitialController];
    
    _windowController = [[NSWindowController alloc] initWithWindow:vc.window];
    [_windowController showWindow:nil];
    [_windowController.window makeKeyAndOrderFront:self];
    [_windowController.window makeMainWindow];
    
    [NSApp activateIgnoringOtherApps:YES];
}

-(void) exitClicked:(id)sender {
    [NSApp performSelector:@selector(terminate:) withObject:nil afterDelay:0.0];
}

@end

//
//  AppDelegate.h
//  HostsETC Launcher
//
//  Created by Omar Zouai on 6/3/17.
//  Copyright © 2017 Omar Zouai. All rights reserved.
//

#import <Cocoa/Cocoa.h>
#import "MenuController.h"
#import "ServerManager.h"
@interface AppDelegate : NSObject <NSApplicationDelegate>
@property (strong, nonatomic) NSStatusItem *statusItem;
@property (strong, nonatomic) NSMenu *statusMenu;
@property (assign, nonatomic) BOOL darkModeOn;
@property (strong, nonatomic) NSWindowController *windowController;
@end


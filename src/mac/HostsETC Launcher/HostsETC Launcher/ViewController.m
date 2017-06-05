//
//  ViewController.m
//  HostsETC Launcher
//
//  Created by Omar Zouai on 6/3/17.
//  Copyright © 2017 Omar Zouai. All rights reserved.
//

#import "ViewController.h"

@implementation ViewController

- (void)viewDidLoad {
    [super viewDidLoad];
    [restrictHosts setState:([ServerManager getInstance]->restrictHosts ? NSOnState : NSOffState)];
    // Do any additional setup after loading the view.
}


- (void)setRepresentedObject:(id)representedObject {
    [super setRepresentedObject:representedObject];

    // Update the view, if already loaded.
}

-(IBAction)exitClicked:(id)sender {
    [NSApp performSelector:@selector(terminate:) withObject:nil afterDelay:0.0];
}
-(IBAction)closeClicked:(id)sender {
    [self.view.window close];
}
-(IBAction)restrictHostsChanged:(NSButton *)sender {
    if([sender state] == NSOnState) [ServerManager getInstance]->restrictHosts = YES;
    else [ServerManager getInstance]->restrictHosts = NO;
}
-(IBAction)serverButtonClicked:(NSButton *)sender {
    if([[ServerManager getInstance] isRunning]) {
        [serverButton setTitle:@"Start Server"];
        [[ServerManager getInstance] terminateServer];
    } else {
        [serverButton setTitle:@"Stop Server"];
        [[ServerManager getInstance] launchServer];
    }
}

@end

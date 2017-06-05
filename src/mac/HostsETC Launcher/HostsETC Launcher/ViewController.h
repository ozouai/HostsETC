//
//  ViewController.h
//  HostsETC Launcher
//
//  Created by Omar Zouai on 6/3/17.
//  Copyright © 2017 Omar Zouai. All rights reserved.
//

#import <Cocoa/Cocoa.h>
#import "ServerManager.h"
@interface ViewController : NSViewController <NSTextFieldDelegate> {
    IBOutlet NSButton *restrictHosts;
    IBOutlet NSButton *serverButton;
    IBOutlet NSTextField *portField;
    IBOutlet NSTextField *addressField;
}
- (IBAction) exitClicked:(id)sender;
- (IBAction) closeClicked:(id)sender;
- (IBAction) checkPipe:(id)sender;
- (IBAction) restrictHostsChanged:(NSButton*)sender;
- (IBAction) serverButtonClicked:(NSButton*)sender;
- (void)controlTextDidChange:(NSNotification *)notification;

@end


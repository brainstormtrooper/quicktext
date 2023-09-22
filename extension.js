/* extension.js
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 * SPDX-License-Identifier: GPL-2.0-or-later
 */

/* exported init */

import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import Meta from 'gi://Meta';
import Shell from 'gi://Shell';
import St from 'gi://St';
import Clutter from 'gi://Clutter';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as ModalDialog from 'resource:///org/gnome/shell/ui/modalDialog.js';
import * as Dialog from 'resource:///org/gnome/shell/ui/dialog.js';
import * as ShellEntry from 'resource:///org/gnome/shell/ui/shellEntry.js';
import * as Util from 'resource:///org/gnome/shell/misc/util.js';
// import * as ExtensionUtils from 'resource:///org/gnome/shell/misc/extensionUtils.js';
import {Extension, gettext as _} from 'resource:///org/gnome/shell/extensions/extension.js';



export default class QuickText extends Extension {


  enable() {
    this.settings = this.getSettings("org.gnome.shell.extensions.quicktext");

    this.fpath = this.settings.get_string('quick-filepath');
    this.pendLoc = this.settings.get_string('quick-pendlocation');
    this.append = this.settings.get_string('quick-append');
    this.prependStr = this.settings.get_string('quick-prepend');
    this.inputMulti = this.settings.get_int('quick-multiline');

    // listen for hotkeys
    Main.wm.addKeybinding(
      "quick-hotkey",
      this.settings,
      Meta.KeyBindingFlags.IGNORE_AUTOREPEAT,
      Shell.ActionMode.NORMAL,
      this.doDialog.bind(this));  

  }

  disable() {
    // release hotkeys
    Main.wm.removeKeybinding("quick-hotkey");
    this.settings = null;
    this.dialog = null;
    this.efpath = null;
    this.ependLoc = null;
    this.eappend = null;
    this.eprepend = null;
  }

  doWindow() {
    try {

      Util.spawn([`${this.path}/actions.js`]);


    } catch (error) {
      console.error(error);
    }
    
  }
  

  doDialog() {
    // show the quickNote dialog
    this.dialog = new ModalDialog.ModalDialog();

    let title = _('Save A Note');

    let content = new Dialog.MessageDialogContent({ title });
    this.dialog.contentLayout.add_actor(content);

    this.entry = new St.Entry({
      style_class: 'quick-dialog-entry',
      can_focus: true,
    });
    ShellEntry.addContextMenu(this.entry);
    this.entry.clutter_text.single_line_mode = false;
    this.entry.clutter_text.line_wrap        = true;
    
    this._entryText = this.entry.clutter_text;
    content.add_child(this.entry);
    this.dialog.setInitialKeyFocus(this._entryText);

    this.efpath = new St.Entry({
      can_focus: false,
      text: this.fpath
    });
    this.ependLoc = new St.Entry({
      can_focus: false,
      text: this.pendLoc
    });  
    this.eappend = new St.Entry({
      can_focus: false,
      text: this.append
    }); 
    this.eprepend = new St.Entry({
      can_focus: false,
      text: this.prependStr
    });


    this.dialog.addButton({
      label: 'Cancel',
      action: () => {
        this.dialog.close();
      },
      key: Clutter.KEY_Escape
    });
    this.dialog.addButton({
      label: 'Actions',
      action: () => {
        this.doWindow();
        this.dialog.close();
      }
    });
    this.dialog.addButton({
      label: 'OK',
      action: () => {
        this.doSaveSnippet();
      }
    });
    this.dialog.open();

    // Bind our indicator visibility to the GSettings value
    //
    // NOTE: Binding properties only works with GProperties (properties
    // registered on a GObject class), not native JavaScript properties
    
    this.settings.bind(
      'quick-multiline',
      this.entry.clutter_text,
      'single_line_mode',
      Gio.SettingsBindFlags.DEFAULT
    );
    this.settings.bind(
      'quick-filepath',
      this.efpath,
      'text',
      Gio.SettingsBindFlags.DEFAULT
    );
    this.settings.bind(
      'quick-pendlocation',
      this.ependLoc,
      'text',
      Gio.SettingsBindFlags.DEFAULT
    );
    this.settings.bind(
      'quick-append',
      this.eappend,
      'text',
      Gio.SettingsBindFlags.DEFAULT
    );
    this.settings.bind(
      'quick-prepend',
      this.eprepend,
      'text',
      Gio.SettingsBindFlags.DEFAULT
    );
  }

  

  fopen (path) {
    return new Promise((resolve, reject) => {
      const file = Gio.File.new_for_path(path);
      // asynchronous file loading...
      file.load_contents_async(null, (file, res) => {
        try {
          // read the file into a variable...
          const contents = file.load_contents_finish(res)[1];
          const decoder = new TextDecoder('utf-8');
          const dataString = decoder.decode(contents);
  
          resolve(dataString);
        } catch (e) {
          console.error(e);
          
          reject(e);
        }
      });
    });
  }

  save (path, dataStr) {
    GLib.file_set_contents(path, dataStr);
  }

  wrap(str) {
    if (this.eprepend.text == '') {
      this.prepend = new Date().toString();
    } else {
      this.prepend = this.eprepend.text;
    }
    return `${this.prepend}\r\n${str}\r\n${this.eappend.text}`;
  }

  async doSaveSnippet() {
    // create and open file
    try {



      let fstr = await this.fopen(this.efpath.text)
      // add snippet (this._entryText = entry.clutter_text;)
      let snippet = this._entryText.get_text()
      if (this.pendLoc == 'BEG') {
        fstr = `${this.wrap(snippet)}\r\n${fstr}`;
      } else {
        fstr = `${fstr}\r\n${this.wrap(snippet)}`;
      }
      // close file
      this.save(this.efpath.text, fstr);
    } catch (error) {
      console.error(error)
      // close dialog
      this.dialog.close();
    }
    
    // close dialog
    this.dialog.close();
  }

}


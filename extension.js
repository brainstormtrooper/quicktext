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
import Pango from 'gi://Pango';
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
    this.max_len_multi = 1000;
    this.max_len_single = 256;
    this.max_len = '';

    // show the quickNote dialog
    this.dialog = new ModalDialog.ModalDialog();

    let title = _('Save A Note');

    let content = new Dialog.MessageDialogContent({ title });
    this.dialog.contentLayout.add_child(content);
    

    this.entry = new St.Entry({
      width: 400,
      y_expand: true,
      x_expand: false
    });
    this.entry.clutter_text.max_length = 1000;
    this.entry.clutter_text.activatable = false;
    this.entry.clutter_text.single_line_mode = false;
    this.entry.clutter_text.line_wrap = true;
    this.entry.clutter_text.line_wrap_mode = Pango.WrapMode.WORD;
  
    ShellEntry.addContextMenu(this.entry);
    
    const layout = new St.BoxLayout({
      width: 400
    });
    layout.add_child(this.entry);

    const scrollView = new St.ScrollView({
      overlay_scrollbars: true,
      hscrollbar_policy: St.PolicyType.NEVER,
      vscrollbar_policy: St.PolicyType.AUTOMATIC,
      width: 400,
      style_class: 'scroll-box'
    });
    scrollView.add_child(layout);
    
    this.counter = new St.Label({
      text: `${this.entry.get_text().length}/${this.max_len}`
    });

    this.entry.clutter_text.connect('text-changed', () => {
      this.counter.set_text(`${this.entry.get_text().length}/${this.max_len}`);
    });

    const box = new St.BoxLayout({
      width: 400,
      vertical: true

    });


    box.add_child(scrollView);
    box.add_child(this.counter);
    content.add_child(box);
    this.dialog.setInitialKeyFocus(this.entry);

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
    
    if (this.entry.clutter_text.single_line_mode) {
      this.max_len = this.max_len_single;
      this.entry.clutter_text.connect('activate', () => {
        this.doSaveSnippet();
      });

    } else {
      this.max_len = this.max_len_multi;
    }
    this.entry.clutter_text.max_length = this.max_len;

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
    return `${this.prepend}\n${str}\n${this.eappend.text}`;
  }

  async doSaveSnippet() {
    // create and open file
    try {



      let fstr = await this.fopen(this.efpath.text)
      // add snippet (this._entryText = entry.clutter_text;)
      let snippet = this.entry.clutter_text.get_text();
      if (this.pendLoc == 'BEG') {
        fstr = `${this.wrap(snippet)}\n${fstr.trim()}`;
      } else {
        fstr = `${fstr.trim()}\n${this.wrap(snippet)}`;
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


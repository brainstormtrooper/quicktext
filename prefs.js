'use strict';
import Adw from 'gi://Adw';
import Gio from 'gi://Gio';
import Gtk from 'gi://Gtk';

import {ExtensionPreferences, gettext as _} from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';


export default class MyExtensionPreferences extends ExtensionPreferences {

fillPreferencesWindow(window) {
  // Use the same GSettings schema as in `extension.js`
  const settings = this.getSettings(
    'org.gnome.shell.extensions.quicktext');

  // Create a preferences page and group
  const page = new Adw.PreferencesPage();
  const group = new Adw.PreferencesGroup();
  page.add(group);

  // Create a new preferences row
  const oneLine = new Adw.ActionRow({ title: 'Only one-line entry' });
  group.add(oneLine);
  // Create the switch and bind its value to the `show-indicator` key
  const toggle = new Gtk.Switch({
    active: settings.get_boolean('quick-multiline'),
    valign: Gtk.Align.CENTER,
  });
  settings.bind(
    'quick-multiline',
    toggle,
    'active',
    Gio.SettingsBindFlags.DEFAULT
  );

  // Add the switch to the row
  oneLine.add_suffix(toggle);
  oneLine.activatable_widget = toggle;



  // Create a new preferences row
  const hotkey = new Adw.ActionRow({ title: 'Hotkey to activate pop-up' });
  group.add(hotkey);

  const hotkeyEntry = new Gtk.Entry({
    text: settings.get_strv('quick-hotkey')[0]
  });

  hotkeyEntry.connect('changed', () => {
    const vals = [ hotkeyEntry.get_text() ];
    settings.set_strv('quick-hotkey', vals);
  });

  // Add the switch to the row
  hotkey.add_suffix(hotkeyEntry);
  hotkey.activatable_widget = hotkeyEntry;



  // Create a new preferences row
  const filePath = new Adw.ActionRow({ title: 'Path to destination note file' });
  group.add(filePath);

  const filePathEntry = new Gtk.Entry({
    text: settings.get_string('quick-filepath'),
    valign: Gtk.Align.CENTER,
  });
  settings.bind(
    'quick-filepath',
    filePathEntry,
    'text',
    Gio.SettingsBindFlags.DEFAULT
  );

  // Add the switch to the row
  filePath.add_suffix(filePathEntry);
  filePath.activatable_widget = filePathEntry;

  // Create a new preferences row
  const prefix = new Adw.ActionRow({ title: 'Prefix line for new notes (leave blank for current date and time)' });
  group.add(prefix);

  const prefixEntry = new Gtk.Entry({
    text: settings.get_string('quick-prepend'),
    valign: Gtk.Align.CENTER,
  });
  settings.bind(
    'quick-prepend',
    prefixEntry,
    'text',
    Gio.SettingsBindFlags.DEFAULT
  );

  // Add the switch to the row
  prefix.add_suffix(prefixEntry);
  prefix.activatable_widget = prefixEntry;

  // Create a new preferences row
  const suffix = new Adw.ActionRow({ title: 'Suffix line for new notes' });
  group.add(suffix);

  const suffixEntry = new Gtk.Entry({
    text: settings.get_string('quick-append'),
    valign: Gtk.Align.CENTER,
  });
  settings.bind(
    'quick-append',
    suffixEntry,
    'text',
    Gio.SettingsBindFlags.DEFAULT
  );


   // Create a new preferences row
   const acted = new Adw.ActionRow({ title: 'Hide acted notes' });
   group.add(acted);
  // Add the switch to the row
  suffix.add_suffix(suffixEntry);
  suffix.activatable_widget = suffixEntry;
 
  const hideacted = new Gtk.Switch({
    active: settings.get_boolean('quick-hideacted'),
    valign: Gtk.Align.CENTER,
  });
  settings.bind(
    'quick-hideacted',
    hideacted,
    'active',
    Gio.SettingsBindFlags.DEFAULT
  );

  // Add the switch to the row
  acted.add_suffix(hideacted);
  acted.activatable_widget = hideacted;

 
  // Add our page to the window
  window.add(page);
}
}

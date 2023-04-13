'use strict';

const { Adw, Gio, Gtk } = imports.gi;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();


function init() {
}

function fillPreferencesWindow(window) {
  // Use the same GSettings schema as in `extension.js`
  const settings = ExtensionUtils.getSettings(
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

  // Add the switch to the row
  suffix.add_suffix(suffixEntry);
  suffix.activatable_widget = suffixEntry;
 
  /*
  const position = new Adw.ActionRow({ title: 'Where to insert new notes in the file' });
  group.add(position);

  const positionEntry = Gtk.DropDown.new_from_strings(['BEG','END']);
  settings.bind(
    'quick-pendlocation',
    positionEntry,
    'selected-item',
    Gio.SettingsBindFlags.DEFAULT
  );

 
  position.add_suffix(positionEntry);
  position.activatable_widget = positionEntry;
  */
  // Add our page to the window
  window.add(page);
}

#!/usr/bin/gjs
'use strict';
const extPath = '.local/share/gnome-shell/extensions/quicktext@brainstormtrooper.github.io';
imports.gi.versions.Gtk = '4.0';
imports.searchPath.unshift(extPath);
const Adw = imports.gi.Adw;
const GLib = imports.gi.GLib;
const Gio = imports.gi.Gio;
const Gtk = imports.gi.Gtk;
const Gdk = imports.gi.Gdk;
const GObject = imports.gi.GObject;
const Gettext = imports.gettext;
const GioSSS = Gio.SettingsSchemaSource;
const { qWindow } = imports.interface;
const { vevent, vtodo, treated } = imports.events;
const spl = Gio.SubprocessLauncher;



const QuickText = GObject.registerClass( // eslint-disable-line
  {
    GTypeName: 'QuickText'
  },
  class QuickText extends Adw.Application {
    _init () {
      this.recycle = {};
      this.ID = 'com.github.brainstormtrooper.QuickText';
      super._init({
        application_id: this.ID
      });
      GLib.set_prgname(this.application_id);
      GLib.set_application_name('QuickText');

    }
    vfunc_shutdown () {
      super.vfunc_shutdown();
    }
    vfunc_activate () {
      super.vfunc_activate();
      // Create the application window
      
      try {
          
        let css_provider = Gtk.CssProvider.new();
        css_provider.load_from_path(`${extPath}/stylesheet.css`);
        // const context = new Gtk.StyleContext();
        const display = Gdk.Display.get_default();
        Gtk.StyleContext.add_provider_for_display(display, css_provider, Gtk.STYLE_PROVIDER_PRIORITY_APPLICATION);

      } catch (error) {
        console.error(error);
      }

      this.window = new qWindow({ application: this });
      this.openButton = this.window._openButton;
      this.toastOverlay = this.window._toast_overlay;
      this.launcher = new spl();
      this.openButton.connect('clicked', () => {
        const settings = this.getSettings();

        this.launcher.spawnv(['xdg-open', settings.get_string('quick-filepath')]);
      });
      
      this.window._listBox.append(this.getListUI());
      
      this.window.present();
    }

    vfunc_startup() {
      super.vfunc_startup();
    }
    
    getSettings () {
      // ["quick-filepath", "quick-multiline", "quick-pendlocation", "quick-append", "quick-hotkey", "quick-prepend"]

      const schemaId = 'org.gnome.shell.extensions.quicktext';
      const schemaSource = GioSSS.new_from_directory(`${extPath}/schemas`, null, true);
      const schema = schemaSource.lookup(schemaId, true);
      const schemaObj = { settings_schema: schema }

      return new Gio.Settings(schemaObj);
    }

    updateListUI (listBox) {
      this.window._listBox.remove(listBox);
      this.window._listBox.append(this.getListUI());
    }

    getListUI () {

      const listBox = new Gtk.Box({
        orientation: Gtk.Orientation.VERTICAL,
        spacing: 6
      });

      

      try {
        let P = this.doList();
        P.then(items => {  
          items.filter(item => /\S/.test(item)).forEach((item, i) => {
            
            const frame = new Gtk.Frame({
              label:  null
            });
            const liBox = new Gtk.Box({
              orientation: Gtk.Orientation.VERTICAL
            });
            const undeleteAction = new Gio.SimpleAction({name: `undelete_${i}`});
            undeleteAction.connect('activate', () => {
              items.splice(i, 0, this.recycle[i]);
              // items[i] = this.recycle[i];
              this.doSave(this.doJoin(items));
              this.updateListUI(listBox);
            });
            this.add_action(undeleteAction);
            const undeleteToast = new Adw.Toast({title: 'Note deleted'});
            undeleteToast.set_button_label('Undo');
            undeleteToast.set_action_name(`app.undelete_${i}`);
            const liTxtView = new Gtk.TextView();
            const liBuffer = new Gtk.TextBuffer();
            liBuffer.set_text(item, -1);
            liTxtView.set_buffer(liBuffer);
            liTxtView.set_editable(false);

            const liBtns = new Gtk.Box({
              orientation: Gtk.Orientation.HORIZONTAL,
              halign: Gtk.Align.END
            });

            const liDeleteBtn = new Gtk.Button({
              icon_name: 'user-trash-symbolic',
              tooltip_text: 'Delete'
            });

            const liEditBtn = new Gtk.Button({
              icon_name: 'document-edit-symbolic',
              tooltip_text: 'Edit'
            });
            const liSaveBtn = new Gtk.Button({
              icon_name: 'document-save-symbolic',
              tooltip_text: 'Save',
              visible: false
            });
            const liCancelBtn = new Gtk.Button({
              icon_name: 'edit-delete-symbolic',
              tooltip_text: 'Cancel',
              visible: false
            });

            const liEventBtn = new Gtk.Button({
              icon_name: 'x-office-calendar-symbolic',
              tooltip_text: 'New Event'
            });
            const liTaskBtn = new Gtk.Button({
              icon_name: 'object-select-symbolic',
              tooltip_text: 'New Task'
            });

            liDeleteBtn.connect('clicked', () => {
              this.recycle[i] = item;
              items = items.filter(v => v != item);
              this.doSave(this.doJoin(items));
              this.toastOverlay.add_toast(undeleteToast);
              this.updateListUI(listBox);
            });

            liEditBtn.connect('clicked', () => {
              liEditBtn.set_visible(false);
              liSaveBtn.set_visible(true);
              liCancelBtn.set_visible(true);
              liTxtView.set_editable(true);
            });

            liCancelBtn.connect('clicked', () => {
              liEditBtn.set_visible(true);
              liSaveBtn.set_visible(false);
              liCancelBtn.set_visible(false);
              liTxtView.set_editable(false);
              this.updateListUI(listBox);
            });

            liSaveBtn.connect('clicked', () => {
              liEditBtn.set_visible(true);
              liSaveBtn.set_visible(false);
              liCancelBtn.set_visible(false);
              liTxtView.set_editable(false);
              items[i] = `${liBuffer.get_text(liBuffer.get_start_iter(), liBuffer.get_end_iter(), true).trim()}\r`;
              this.doSave(this.doJoin(items));
              // this.toastOverlay.add_toast(undeleteToast);
              this.updateListUI(listBox);
            });

            liEventBtn.connect('clicked', () => {
              const eventstr = this.strRepl(vevent, item);

              const [tmpevent, ] = Gio.File.new_tmp('quick-XXXXXX.ics');
              const bytes = GLib.ByteArray.new_take(eventstr);
              tmpevent.replace_contents(bytes, null, false, null, null);
              this.launcher.spawnv(['xdg-open', tmpevent.get_path()]);
              
              items[i] = this.doFlag(item);
              this.doSave(this.doJoin(items));
              this.updateListUI(listBox);

            });
            liTaskBtn.connect('clicked', () => {
              
              const todostr = this.strRepl(vtodo, item);

              const [tmptodo, ] = Gio.File.new_tmp('quick-XXXXXX.ics');
              const bytes = GLib.ByteArray.new_take(todostr);
              tmptodo.replace_contents(bytes, null, false, null, null);
              this.launcher.spawnv(['xdg-open', tmptodo.get_path()]);
              
              items[i] = this.doFlag(item);
              this.doSave(this.doJoin(items));
              this.updateListUI(listBox);
            });
            liBtns.append(liEditBtn);
            liBtns.append(liSaveBtn);
            liBtns.append(liCancelBtn);
            liBtns.append(liEventBtn);
            liBtns.append(liTaskBtn);
            liBtns.append(liDeleteBtn);
            liBtns.add_css_class('toolbar');
            
            liBox.append(liTxtView);
            liBox.append(liBtns);
            liBox.add_css_class('card');
            frame.set_child(liBox);
            listBox.append(frame);

          });
        
        });
      } catch (error) {
        console.error(error);
      }

      return listBox;
    }

    doFlag (item) {
      const now = GLib.DateTime.new_now_utc();
      const stamp = now.format('%Y%m%dT%H%M%SZ');
      return `${item}${treated.replace('{{stamp}}', stamp)}\r`;
    }

    doJoin (items) {
      const settings = this.getSettings();
      const append = settings.get_string('quick-append');

      return items.join(append);
    }

    async doList () {
      let res = [];
      const settings = this.getSettings();
      const hideActed = settings.get_boolean('quick-hideacted');
      const fpath = settings.get_string('quick-filepath');
      const append = settings.get_string('quick-append');
      try {
        
        // [\s\S]*?(?<=^---$)
        let fileStr = await this.fopen(fpath);
        let list = fileStr.split(append);
        
        list.forEach(li => {
          if ((hideActed && !li.match(/Quick treated/m)) || !hideActed) {
            res.push(li);
          }
          
        });
        
      } catch (error) {
        console.error(error);
      }
      
      return res;
    }

    getSummary(note) {
      const lines = note.trim().split("\n").slice(1);
      const summary = (lines[0].length > 90) ? lines[0].slice(0, n-1) + '...' : lines[0];
      const desc = lines.join('\n');
      return [summary, desc];
    }

    strRepl (tpl, note) {
      let myCal = tpl;
      const id = this.makeid();

      const now = GLib.DateTime.new_now_utc();
      const stamp = now.format('%Y%m%dT%H%M%SZ');
      const start = now.add_days(1);
      const startdue = start.format('%Y%m%dT%H%M%SZ');
      const end = start.add_hours(1);
      const enddate = end.format('%Y%m%dT%H%M%SZ');
      
      myCal = myCal.replace(/{{stamp}}/gm, stamp);
      myCal = myCal.replace(/{{duedate}}/gm, startdue);
      myCal = myCal.replace(/{{startdate}}/gm, startdue);
      myCal = myCal.replace(/{{enddate}}/gm, enddate);
      myCal = myCal.replace(/{{uuid}}/gm, id);
      myCal = myCal.replace(/{{summary}}/gm, this.getSummary(note)[0]);
      myCal = myCal.replace(/{{note}}/gm, this.getSummary(note)[1]);

      return myCal;
    }

    makeid () {
      let result = '';
      const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
      const charactersLength = characters.length;
      let counter = 0;
      while (counter < 6) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
        counter += 1;
      }

      return result;
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

    doSave(str) {
      const settings = this.getSettings();
      const fpath = settings.get_string('quick-filepath');
      const file = Gio.File.new_for_path(fpath);
      file.replace_contents(str, null, false,
        Gio.FileCreateFlags.REPLACE_DESTINATION, null);
    }

  }
)
const qtapp = new QuickText();

try {
  qtapp.run([imports.system.programInvocationName]);
} catch (error) {
  console.error(error);
}

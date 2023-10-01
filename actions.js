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
      this.items = [];
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
      this.timeFmt = this.getTimeFormat();
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
    
    getTimeFormat () {
      const schemaId = 'org.gnome.desktop.interface';
      const gSettings = new Gio.Settings({ schema: schemaId });
      const timeFmt = gSettings.get_string('clock-format');
      return timeFmt;
    }

    getSettings () {
      // ["quick-filepath", "quick-multiline", "quick-pendlocation", "quick-append", "quick-hotkey", "quick-prepend"]

      const schemaId = 'org.gnome.shell.extensions.quicktext';
      const schemaSource = GioSSS.new_from_directory(`${extPath}/schemas`, null, true);
      const schema = schemaSource.lookup(schemaId, true);
      const schemaObj = { settings_schema: schema }

      return new Gio.Settings(schemaObj);
    }

    updateListUI () {
      this.window._listBox.remove(this.listBox);
      this.window._listBox.append(this.getListUI());
    }


    leadingZeros (spin_button) {
      const adjustment = spin_button.get_adjustment();
      spin_button.set_text(String(adjustment.get_value()).padStart(2, '0'));
      return true;
    }

    getPicker (i) {
      
      const now = GLib.DateTime.new_now_local();

      const tbtn = Gtk.ToggleButton.new_with_label('Task');
      const ebtn = Gtk.ToggleButton.new_with_label('Event');
      ebtn.set_group(tbtn);
      ebtn.set_active(true);
      const rowLabel = new Gtk.Label({label: 'Create new : '});
      const rowLimit = new Gtk.Label({label: 'Duration : '});
      const dAdjust = new Gtk.Adjustment({
        value: 1,
        lower: 1,
        upper: 24,
        step_increment: 1
      });

      const duration = new Gtk.SpinButton({
        adjustment: dAdjust,
        climb_rate: 1,
        numeric: true,
        digits: 0,
        value: 1,
        hexpand: false
      });
      duration.set_orientation(Gtk.Orientation.HORIZONTAL);

      tbtn.connect('toggled', () => {
        rowLimit.set_label('Due :');
        duration.set_visible(false);
      });
      ebtn.connect('toggled', () => {
        rowLimit.set_label('Duration :');
        duration.set_visible(true);
      });

      const row1 = new Gtk.Box({
        orientation: Gtk.Orientation.HORIZONTAL,
        spacing: 6
      });
      const row2 = new Gtk.Box({
        orientation: Gtk.Orientation.HORIZONTAL,
        spacing: 6
      });
      row1.append(rowLabel);
      row1.append(tbtn);
      row1.append(ebtn);
      row2.append(rowLimit);
      row2.append(duration);
      const row3 = new Gtk.Box({
        orientation: Gtk.Orientation.HORIZONTAL,
        spacing: 6
      });

      const calendar = new Gtk.Calendar();

      const hAdjust = new Gtk.Adjustment({
        value: now.get_hour(),
        lower: 1,
        upper: (this.timeFmt == '12h' ? 12 : 24),
        step_increment: 1
      });
      const hours = new Gtk.SpinButton({
        adjustment: hAdjust,
        climb_rate: 1,
        numeric: true,
        digits: 0,
        value: now.get_hour(),
        vexpand: false
      });
      hours.set_orientation(Gtk.Orientation.VERTICAL);
      hours.connect('output', this.leadingZeros);
      const mAdjust = new Gtk.Adjustment({
        value: now.get_minute(),
        lower: 0,
        upper: 59,
        step_increment: 10
      });
      const minutes = new Gtk.SpinButton({
        adjustment: mAdjust,
        climb_rate: 10,
        numeric: true,
        digits: 0,
        value: now.get_minute(),
        vexpand: false
      });
      minutes.set_orientation(Gtk.Orientation.VERTICAL);
      minutes.connect('output', this.leadingZeros);
      const timeSep = new Gtk.Label({ label: ':' });
      const am = Gtk.ToggleButton.new_with_label('AM');
      const pm = Gtk.ToggleButton.new_with_label('PM');
      pm.set_group(am);
      if (now.get_hour() >= 12) {
        pm.set_active(true);
        if (this.timeFmt == '12h' && now.get_hour() > 12) {
          hours.set_value(now.get_hour() - 12);
        }
      } else {
        am.set_active(true);
      }
      const ampmBox = new Gtk.Box({
        orientation: Gtk.Orientation.VERTICAL,
        spacing: 6,
        visible: (this.timeFmt == '12h' ? true : false)
      });
      ampmBox.append(am);
      ampmBox.append(pm);
      const timeBox = new Gtk.Box({
        orientation: Gtk.Orientation.HORIZONTAL,
        spacing: 6,
        baseline_position: Gtk.BaselinePosition.CENTER,
        vexpand: false
      });
      timeBox.append(hours);
      timeBox.append(timeSep);
      timeBox.append(minutes);
      timeBox.append(ampmBox);
      const times = new Gtk.Box({
        orientation: Gtk.Orientation.VERTICAL,
        spacing: 6,
        homogeneous: true
      });
      const above = new Gtk.Separator({ orientation: Gtk.Orientation.VERTICAL });
      const below = new Gtk.Separator({ orientation: Gtk.Orientation.VERTICAL });
      above.add_css_class('spacer');
      below.add_css_class('spacer');
      times.append(above);
      times.append(timeBox);
      times.append(below);
      row3.append(calendar);
      row3.append(times);
      const pickBox = new Gtk.Box({
        orientation: Gtk.Orientation.VERTICAL,
        spacing: 6
      });
      const save = new Gtk.Button({
        label: 'Save'
      });
      const row4 = new Gtk.Box({
        orientation: Gtk.Orientation.HORIZONTAL,
        spacing: 6,
        halign: Gtk.Align.END 
      });
      row4.append(save);
      pickBox.append(row1);
      pickBox.append(row2);
      pickBox.append(row3);
      pickBox.append(row4);

      save.connect('clicked', () => {
        let start, end, due;
        const note = this.items[i];
        const isEvent = ebtn.get_active();
        // const targetHr = (isEvent ? parseInt(hours.get_value()) + 1 : parseInt(hours.get_value()));
        const selDate = calendar.get_date();
        const hour = ((pm.get_active() && this.timeFmt == '12h' && parseInt(hours.get_value()) < 12) ? String(parseInt(hours.get_value() + 12)) : hours.get_value());
        start = GLib.DateTime.new_local(
          selDate.get_year(), 
          selDate.get_month(), 
          selDate.get_day_of_month(), 
          hour, 
          minutes.get_value(), 
          '00'
        );
        due = start;
        end = start.add_hours(parseInt(duration.get_value()));

        const obj = { note, start, end, due, isEvent };
        const tpl = (isEvent ? vevent : vtodo);
        const eventstr = this.strRepl(tpl, obj);

        const [tmpevent, ] = Gio.File.new_tmp('quick-XXXXXX.ics');
        const bytes = GLib.ByteArray.new_take(eventstr);
        tmpevent.replace_contents(bytes, null, false, null, null);
        this.launcher.spawnv(['xdg-open', tmpevent.get_path()]);
        this.items[i] = this.doFlag(this.items[i]);
        this.doSave(this.doJoin(this.items));
        this.updateListUI();
        

      });
      
      return pickBox;

    }

    getListUI () {
      const settings = this.getSettings();
      const hideActed = settings.get_boolean('quick-hideacted');
      this.listBox = new Gtk.Box({
        orientation: Gtk.Orientation.VERTICAL,
        spacing: 6
      });

      

      try {
        this.doList();
        this.items.filter(item => /\S/.test(item)).forEach((item, i) => {
          if ((hideActed && !item.match(/Quick treated/m)) || !hideActed) {
              
            
            const frame = new Gtk.Frame({
              label:  null
            });
            const liBox = new Gtk.Box({
              orientation: Gtk.Orientation.VERTICAL
            });
            const undeleteAction = new Gio.SimpleAction({name: `undelete_${i}`});
            undeleteAction.connect('activate', () => {
              this.items.splice(i, 0, this.recycle[i]);
              // items[i] = this.recycle[i];
              this.doSave(this.doJoin(this.items));
              this.updateListUI();
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

            const ePopover = new Gtk.Popover();
            ePopover.set_child(this.getPicker(i));

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

            const liEventBtn = new Gtk.MenuButton({
              icon_name: 'x-office-calendar-symbolic',
              tooltip_text: 'New Event',
              popover: ePopover
            });

            liDeleteBtn.connect('clicked', () => {
              this.recycle[i] = item;
              this.items = this.items.filter(v => v != item);
              this.doSave(this.doJoin(this.items));
              this.toastOverlay.add_toast(undeleteToast);
              this.updateListUI();
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
              this.updateListUI();
            });

            liSaveBtn.connect('clicked', () => {
              liEditBtn.set_visible(true);
              liSaveBtn.set_visible(false);
              liCancelBtn.set_visible(false);
              liTxtView.set_editable(false);
              this.items[i] = `${liBuffer.get_text(liBuffer.get_start_iter(), liBuffer.get_end_iter(), true).trim()}\n`;
              this.doSave(this.doJoin(this.items));
              // this.toastOverlay.add_toast(undeleteToast);
              this.updateListUI();
            });
            
            liBtns.append(liEditBtn);
            liBtns.append(liSaveBtn);
            liBtns.append(liCancelBtn);
            liBtns.append(liEventBtn);
            // liBtns.append(liTaskBtn);
            liBtns.append(liDeleteBtn);
            liBtns.add_css_class('toolbar');
            
            liBox.append(liTxtView);
            liBox.append(liBtns);
            liBox.add_css_class('card');
            frame.set_child(liBox);
            this.listBox.append(frame);
          }
        });
      } catch(error) {
        console.error(error);
      };

      return this.listBox;
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

    doList () {
      // let list;
      const settings = this.getSettings();
      const fpath = settings.get_string('quick-filepath');
      const append = settings.get_string('quick-append');
      try {
        
        // [\s\S]*?(?<=^---$)
        let fileStr = this.fopen(fpath);
        this.items = fileStr.split(append);
        
        
        
      } catch (error) {
        console.error(error);
      }
      
      
    }

    getSummary(note) {

      let lines = note.trim().split(/\r\n|\r|\n/gm);
      const summary = (lines[1].length > 72) ? lines[1].slice(0, n-1) + '...' : lines[1];
      // const desc = note.match(/.{1,72}/g).join("\r\n ");
      lines = lines.map(l => l.match(/.{1,72}/g).join("\r\n "));
      const desc = lines.join('\\n');
      return [summary, desc];
    }

    strRepl (tpl, obj) {
      // obj = { note, start, end, due, isEvent }
      let myCal = tpl;
      const id = this.makeid();
      const [summary, note] = this.getSummary(obj.note);

      const now = GLib.DateTime.new_now_utc();
      const stamp = now.format('%Y%m%dT%H%M%SZ');
      const start = obj.start.to_utc();
      const startdate = start.format('%Y%m%dT%H%M%SZ');
      const due = obj.due.to_utc();
      const duedate = due.format('%Y%m%dT%H%M%SZ');
      const end = obj.end.to_utc();
      const enddate = end.format('%Y%m%dT%H%M%SZ');
      
      myCal = myCal.replace(/{{stamp}}/gm, stamp);
      myCal = myCal.replace(/{{duedate}}/gm, duedate);
      myCal = myCal.replace(/{{startdate}}/gm, startdate);
      myCal = myCal.replace(/{{enddate}}/gm, enddate);
      myCal = myCal.replace(/{{uuid}}/gm, id);
      myCal = myCal.replace(/{{summary}}/gm, summary);
      myCal = myCal.replace(/{{note}}/gm, note);

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
      let dataString;
      const file = Gio.File.new_for_path(path);
      // asynchronous file loading...
      const [ok, string, ] = file.load_contents(null);
      if (ok) {
        const decoder = new TextDecoder('utf-8');
        dataString = decoder.decode(string);
      } else {
        console.error('Failed to open file');
      }
      return dataString;

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

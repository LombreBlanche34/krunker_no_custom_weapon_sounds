(function () {

    // Wait for SOUND to be available
    const initScript = () => {
        if (!window.SOUND || !window.SOUND.play) {
            setTimeout(initScript, 100);
            return;
        }

        console.log("[LombreScripts] [no_customWeaponSounds.js] === AUDIO SCRIPT INITIALIZATION ===");

        // ==========================================
        // CONFIGURATION & DEFAULTS
        // ==========================================

        const defaults = {
            lombre_no_customWeaponSounds_status: true,
            lombre_no_customWeaponSounds_my_weapons: true,
            lombre_no_customWeaponSounds_ennemi_weapons: true
        };

        // Initialize localStorage if values don't exist
        Object.keys(defaults).forEach(key => {
            if (localStorage.getItem(key) === null) {
                localStorage.setItem(key, defaults[key]);
                console.log(`[LombreScripts] [no_customWeaponSounds.js] ${key} created with default value: ${defaults[key]}`);
            }
        });

        // Check if script is enabled
        const scriptStatus = localStorage.getItem('lombre_no_customWeaponSounds_status');
        const isEnabled = scriptStatus === 'true' || scriptStatus === true;

        if (!isEnabled) {
            console.log("[LombreScripts] [no_customWeaponSounds.js] Script is disabled");
            return;
        }

        console.log("[LombreScripts] [no_customWeaponSounds.js] Script is enabled");

        // Load configuration
        const config = {
            MY_WEAPONS: localStorage.getItem('lombre_no_customWeaponSounds_my_weapons'),
            ENNEMI_WEAPONS: localStorage.getItem('lombre_no_customWeaponSounds_ennemi_weapons'),
        };

        const mySounds = config.MY_WEAPONS === 'true' || config.MY_WEAPONS === true;
        const ennemiSounds = config.ENNEMI_WEAPONS === 'true' || config.ENNEMI_WEAPONS === true;

        // ==========================================
        // HELPER FUNCTION: Convert weapon sound
        // ==========================================
        function convertWeaponSound(soundName) {
            if (soundName && typeof soundName === 'string' && soundName.startsWith('weapon_')) {
                const parts = soundName.split('_');

                // If format is weapon_X_Y or weapon_X_Y_Z (has more than 2 parts)
                if (parts.length > 2) {
                    const modifiedSoundName = `${parts[0]}_${parts[1]}`;
                    console.log(`[LombreScripts] [no_customWeaponSounds.js] Replaced: ${soundName} → ${modifiedSoundName}`);
                    return modifiedSoundName;
                }
            }
            return soundName;
        }

        // ==========================================
        // HOOK 1: window.SOUND.play (for local sounds)
        // ==========================================
        const originalPlay = window.SOUND.play;

        window.SOUND.play = function (soundName, volume, loop) {
            let modifiedSoundName;

            if (mySounds) {
                modifiedSoundName = convertWeaponSound(soundName);
            } else {
                modifiedSoundName = soundName;
            }

            return originalPlay.call(this, modifiedSoundName, volume, loop);
        };

        console.log("[LombreScripts] [no_customWeaponSounds.js] window.SOUND.play hooked");

        // ==========================================
        // HOOK 2: Howler.js (for enemy sounds)
        // ==========================================
        const hookHowler = () => {
            if (window.Howl) {
                const OriginalHowl = window.Howl;

                window.Howl = function (options) {
                    // Only convert if ennemiSounds is enabled
                    if (ennemiSounds && options && options.src) {
                        if (Array.isArray(options.src)) {
                            options.src = options.src.map(src => {
                                if (typeof src === 'string') {
                                    const parts = src.split('/');
                                    const filename = parts[parts.length - 1];
                                    const nameWithoutExt = filename.replace(/\.[^/.]+$/, "");
                                    const converted = convertWeaponSound(nameWithoutExt);

                                    if (converted !== nameWithoutExt) {
                                        parts[parts.length - 1] = filename.replace(nameWithoutExt, converted);
                                        return parts.join('/');
                                    }
                                }
                                return src;
                            });
                        } else if (typeof options.src === 'string') {
                            const parts = options.src.split('/');
                            const filename = parts[parts.length - 1];
                            const nameWithoutExt = filename.replace(/\.[^/.]+$/, "");
                            const converted = convertWeaponSound(nameWithoutExt);

                            if (converted !== nameWithoutExt) {
                                parts[parts.length - 1] = filename.replace(nameWithoutExt, converted);
                                options.src = parts.join('/');
                            }
                        }
                    }

                    return new OriginalHowl(options);
                };

                // Copy static methods/properties
                Object.setPrototypeOf(window.Howl, OriginalHowl);
                Object.keys(OriginalHowl).forEach(key => {
                    window.Howl[key] = OriginalHowl[key];
                });

                console.log("[LombreScripts] [no_customWeaponSounds.js] Howler.js hooked");
            } else {
                console.log("[LombreScripts] [no_customWeaponSounds.js] Howler not found, retrying in 100ms...");
                setTimeout(hookHowler, 100);
            }
        };

        hookHowler();
        // ==========================================
        // HOOK 3: Audio constructor ("in case" method)
        // ==========================================
        const OriginalAudio = window.Audio;
        window.Audio = function (src) {
            if (src && typeof src === 'string') {
                const parts = src.split('/');
                const filename = parts[parts.length - 1];
                const nameWithoutExt = filename.replace(/\.[^/.]+$/, "");
                const converted = convertWeaponSound(nameWithoutExt);

                if (converted !== nameWithoutExt) {
                    parts[parts.length - 1] = filename.replace(nameWithoutExt, converted);
                    src = parts.join('/');
                }
            }
            return new OriginalAudio(src);
        };

        console.log("[LombreScripts] [no_customWeaponSounds.js] Audio constructor hooked");

        console.log("[LombreScripts] [no_customWeaponSounds.js] === AUDIO SCRIPT READY ===");
    };

    console.log("[LombreScripts] [no_customWeaponSounds.js] Script loading...");
    initScript();

})();
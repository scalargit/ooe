Ext.define('sw.capco.Rollup', {

    classMap: null,
    classification: null,
    style: null,
    count: 0,
    dirty: true,

    fgi: null,
    declass: null,
    dissem: null,
    relTo: null,
    compartments: null,
    nonIC: null,

    defaultClassification: null,
    defaultStyle: null,
    LEVEL_MAP: ['TOP SECRET', 'SECRET', 'CONFIDENTIAL', 'UNCLASSIFIED'],
    TS: 0,
    S: 1,
    C: 2,
    U: 3,
    HCS : "HCS",
    SI : "SI",
    TK : "TK",
    G : "G",
    FOUO: "FOUO",

    constructor: function(cfg) {
        this.classMap = {};
        this.dissem = Ext.create('Ext.util.HashMap');
        this.relTo = Ext.create('Ext.util.HashMap');
        this.compartments = Ext.create('Ext.util.HashMap');
        this.nonIC = Ext.create('Ext.util.HashMap');

        this.defaultClassification = o2e.env.defaultClassification;
        this.defaultStyle = o2e.env.defaultClassificationStyle;

        Ext.apply(this, cfg);
    },

    getClassification: function() {
        if (this.dirty) {
            this.buildMarking();
        }
        return this.classification || this.defaultClassification;
    },

    getStyle: function() {
        if (this.dirty) {
            this.buildMarking();
        }
        return this.style || this.defaultStyle;
    },

    getCount: function() {
        return this.count;
    },

    isDirty: function() {
        return this.dirty;
    },

    add: function(classification) {
        var map = this.classMap;
        classification = this.normalize(classification);
        if (map.hasOwnProperty(classification)) {
            map[classification]++;
            this.count++;
        } else {
            this.dirty = true;
            map[classification] = 1;
            this.processClassification(classification);
        }
    },

    remove: function(classification) {
        var c, map = this.classMap;
        classification = this.normalize(classification);
        if (map.hasOwnProperty(classification)) {
            if (map[classification] === 1) {
                delete map[classification];
                // if we delete a stored classification, we have to roll back up.
                this.level = null;
                this.style = null;
                this.fgi = null;
                this.declass = null;
                this.dissem.clear();
                this.relTo.clear();
                this.compartments.clear();
                this.nonIC.clear();

                for (c in map) {
                    if (map.hasOwnProperty(c)) {
                        this.processClassification(c);
                    }
                }

                this.dirty = true;
            } else {
                map[classification]--;
            }
        }
    },

    clear: function() {
        // Reset state
        this.classMap = {};
        this.classification = null;
        this.style = null;
        this.count = 0;
        this.dirty = true;
        this.level = null;
        this.fgi = null;
        this.declass = null;

        // Empty hashmaps
        this.dissem.clear();
        this.relTo.clear();
        this.compartments.clear();
        this.nonIC.clear();
    },

    //Private
    normalize: function(classification) {
        return classification ? Ext.String.trim(classification).toUpperCase() : classification;
    },

    processClassification: function(classification) {
		var fgis = [], currLevel = '', isJoint = false, classifs, currChar, levelPortion;

		if (classification.match(/^\/\//)) {

			levelPortion = classification.substring(2);
			if (levelPortion.indexOf("/") != -1) {
				levelPortion = levelPortion.substring(0, levelPortion.indexOf("/"));
			}

			this.fgi = true;

			if (levelPortion.match(/JOINT/)) {
				levelPortion = levelPortion.substring("JOINT ".length);
				isJoint = true;
			}
			if (levelPortion.match(/FGI/)) {
				currLevel = levelPortion.split(" ")[1].substring(0,1);
			} else {
				if (levelPortion.match(/TOP SECRET/)) {
					levelPortion = levelPortion.replace(this.TS, "TS");
				}
				classifs = levelPortion.split(" ");
				if (isJoint) {
					currLevel = classifs[0];
					fgis = classifs.slice(1,classifs.length);
				} else {
					currLevel = classifs[classifs.length-1].substring(0,1);
					fgis = classifs.slice(0,classifs.length-1);
				}
				if (!classification.match(/\/REL/)) {
					classification = [classification, "//REL TO USA, ", fgis.join(", ")].join("");
				}
				//TODO: need an else here, plus need to add the FGIs to an FGI value.
			}

			switch(currLevel) {
                case 'T' :
                case 'TS' :
                    this.level = this.TS;
                    break;
                case 'S' :
                    if (this.level !== this.TS) {
                        this.level = this.S;
                    }
                    break;
                case 'C' :
                    if (this.level !== this.TS && this.level !== this.S) {
                        this.level = this.C;
                    }
                    break;
            }
		}

        currChar = classification.charAt(0);
		if (currChar === 'T' || this.level === this.TS) {
			this.level = this.TS;
			this.dissem.removeAtKey(this.FOUO, false);
			this.dissem.removeAtKey("DSEN", false);
			this.dissem.removeAtKey("DCNI", false);
			this.dissem.removeAtKey("ECNI", false);
			this.style = 'sw-topsecret';
		} else if (currChar === 'S' || this.level === this.S) {
			this.level = this.S;
			this.dissem.removeAtKey(this.FOUO, false);
			this.dissem.removeAtKey("DSEN", false);
			this.dissem.removeAtKey("DCNI", false);
			this.dissem.removeAtKey("ECNI", false);
			this.style = 'sw-secret';
		} else if (currChar === 'C' || this.level === this.C) {
			this.level = this.C;
			this.dissem.removeAtKey(this.FOUO, false);
			this.dissem.removeAtKey("DSEN", false);
			this.dissem.removeAtKey("DCNI", false);
			this.dissem.removeAtKey("ECNI", false);
			this.style = 'sw-confidential';
		} else if (currChar === 'U') {
			this.level = this.U;
			this.style = 'sw-unclassified';
		}

		if (this.level === this.TS || this.level === this.S || this.level === this.C) {

			if (classification.match(/HCS/) || classification.match(/HUMINT/)) {
				this.compartments.replace(this.HCS, true);
			}
			if (classification.match(/\/SI/) || classification.match(/COMINT/)) {
				this.compartments.replace(this.SI, true);
			}

			if (this.level != this.C) {
				if (classification.match(/\/G$/) || classification.match(/GAMMA/) || classification.match(/\/G\//) || classification.match(/SI-G/)) {
					this.compartments.replace("G", true);
					this.compartments.replace(this.SI, true);
				}
				if (classification.match(/\/TK/)) {
					this.compartments.replace("TK", true);
				}
				if (classification.match(/ORCON/) || classification.match(/ORIGINATOR/) || classification.match(/[^\w]OC[^\w]/)) {
					this.dissem.replace("ORCON", true);
				}
				if (classification.match(/RSEN/) || classification.match(/RISK SENSITIVE/)) {
					this.dissem.replace("RSEN", true);
				}
				if (classification.match(/FRONTO/)) {
					this.dissem.replace("FRONTO", true);
				}
				if (classification.match(/KEYRUT/)) {
					this.dissem.replace("KEYRUT", true);
				}
				if (classification.match(/SEABOOT/)) {
					this.dissem.replace("SEABOOT", true);
				}
				if (classification.match(/SETTEE/)) {
					this.dissem.replace("SETTEE", true);
				}
				if ((classification.match(/IMC/) || classification.match(/CONTROLLED IMAGERY/)) && this.level !== this.TS) {
					this.dissem.replace("IMCON", true);
				}
			}

			if (classification.match(/RD/) || classification.match(/RESTRICTED DATA/)) {
				if (classification.match(/FRD/) || classification.match(/FORMERLY/)) {
					this.dissem.replace("FRD", true);
				} else {
					this.dissem.replace("RD", true);
				}
				if (this.level != this.C && (classification.match(/CNWDI/) || classification.match(/CRITICAL NUCLEAR/))) {
					this.dissem.replace("-CNWDI", true);
				}
				if (classification.match(/SIGMA/) || classification.match(/SG/)) {
					//TODO: add this dissem
				}
			}

			if (classification.match(/FGI/)) {
				this.fgi = true;
				//TODO: gonna have to figure out who they are from and include them.
			}

			if (classification.match(/NOFORN/) || classification.match(/NF/) || classification.match(/NOT RELEASABLE TO FOREIGN NATIONALS/)) {
				this.dissem.replace("NOFORN", true);
				this.relTo.clear();
				this.dissem.removeAtKey("RELIDO", false);
			}

			if (classification.match(/SAMI/) || classification.match(/SOURCES AND METHODS INFORMATION/)) {
				this.dissem.replace("SAMI", true);
			}

			if (!this.dissem.containsKey("NOFORN")) {
                this.processRels(classification, fgis);
			} else {
				this.relTo.clear();
			}

		} else {
			if (classification.match(/CONTROLLED NUCLEAR INFO/) || classification.match(/CNI/)) {
				if (classification.match(/DCNI/) || classification.match(/DOD/)) {
					this.dissem.replace("DCNI", true);
				} else {
					this.dissem.replace("ECNI", true);
				}
			}
			if (classification.match(/DSEN/) || classification.match(/DEA SEN/)) {
				this.dissem.replace("DSEN", true);
			}
			if ((classification.match(/FOUO/) || classification.match(/FOR OFFICIAL USE ONLY/)) && this.level === this.U) {
				this.dissem.replace("FOUO", true);
			}
			if (classification.match(/SINFO/)) {
				this.nonIC.replace("SINFO", true);
			}
			if (classification.match(/SBU/)) {
				this.nonIC.replace("SBU", true);
			}
		}

		if (classification.match(/FISA/) || classification.match(/SURVEILLANCE/)) {
			this.dissem.replace("FISA", true);
		}

		if (classification.match(/PROPIN/) || classification.match(/[^\w]PR[^\w]/)) {
			this.dissem.replace("PROPIN", true);
		}

		if (classification.match(/RELIDO/) || classification.match(/RELEASABLE BY INFO/)) {
			if (!this.dissem.containsKey("NOFORN") || !this.dissem.get("NOFORN")) {
				this.dissem.replace("RELIDO", true);
			}
		}

		if (classification.match(/\/\/(\d\d\d\d\d\d\d\d)$/)) {
			this.declass = RegExp["$1"];
		} else if (classification.match(/\/\/(X\d)$/)) {
			this.declass = RegExp["$1"];
		} else if (classification.match(/\/\/(25X\d)$/)) {
			this.declass = RegExp["$1"];
		} else if (classification.match(/\/\/(MR)$/)) {
			this.declass = RegExp["$1"];
		}
	},

    processRels: function(classification, fgis) {
        var relToString, relToVals, i, len, relRemoves;

        if (classification.match(/\/REL/)) {
            relToString = RegExp["$1"];
            relToVals = relToString.split(", ").concat(fgis);
            for (i=0, len=relToVals.length; i<len; i++) {
                if (relToVals[i] === relToVals[i+1]) {
                    relToVals.splice(i,1);
                }
            }
            if (this.count === 1) {
                for (i=0; i<len; i++) {
                    this.relTo.replace(relToVals[i], true);
                }
            } else if (this.relTo.getCount() > 0) {
                //TODO: no support of tetras here... just count them as if they're countries
                relRemoves = [];
                this.relTo.eachKey(function(rel) {
                    if (relToVals.indexOf(rel) === -1) {
                        relRemoves.push(rel);
                    }
                });
                Ext.each(relRemoves, function(rel) {
                    this.relTo.removeKey(rel);
                });
            }
        }
    },

	buildMarking: function() {
		var result = this.LEVEL_MAP[this.level], compartmentsArr = [], dissemArr = [], countries = [], tetras = [];

        this.dirty = false;

        if (this.compartments.getCount() > 0) {
            if (this.compartments.containsKey("HCS")) {
                compartmentsArr.push("HCS");
            }
            if (this.compartments.containsKey("SI")) {
                if (this.compartments.containsKey("G")) {
                    compartmentsArr.push("SI-G");
                } else {
                    compartmentsArr.push("SI");
                }
            }
            if (this.compartments.containsKey("TK")) {
                compartmentsArr.push("TK");
            }
			result += "//" + compartmentsArr.join("/");
			this.style = 'sw-sci';
        }

		if (this.fgi) {
			result += "//FGI";
			//TODO: going to have to include country codes here
		}

        if (this.dissem.getCount() > 0) {
            if (this.dissem.containsKey("RSEN")) {
                dissemArr.push("RSEN");
            }
            if (this.dissem.containsKey("FOUO")) {
                dissemArr.push("FOUO");
            }
            if (this.dissem.containsKey("ORCON")) {
                dissemArr.push("ORCON");
            }
            if (this.dissem.containsKey("IMCON")) {
                dissemArr.push("IMCON");
            }
            if (this.dissem.containsKey("SAMI")) {
                dissemArr.push("SAMI");
            }
            if (this.dissem.containsKey("NOFORN")) {
                dissemArr.push("NOFORN");
            }
            if (this.dissem.containsKey("PROPIN")) {
                dissemArr.push("PROPIN");
            }
        }

		if (this.relTo.getCount() > 1) {
			this.relTo.eachKey(function(key) {
				if (key.length === 3) {
					if (key !== "USA") {
						countries.push(key);
					}
				} else {
					tetras.push(key);
				}
			}, this);

			countries.sort();
			tetras.sort();
			countries.unshift("USA");
			dissemArr.push("REL TO "+countries.concat(tetras).join(", "));
		}

        if (this.dissem.getCount() > 0) {
            if (this.dissem.containsKey("RELIDO")) {
                dissemArr.push("RELIDO");
            }
            if (this.dissem.containsKey("RD")) {
                dissemArr.push("RD");
            }
            if (this.dissem.containsKey("-CNWDI")) {
                dissemArr.push("-CNWDI");
            }
            if (this.dissem.containsKey("FRD")) {
                dissemArr.push("FRD");
            }
            if (this.dissem.containsKey("DCNI")) {
                dissemArr.push("DCNI");
            }
            if (this.dissem.containsKey("ECNI")) {
                dissemArr.push("ECNI");
            }
            if (this.dissem.containsKey("FRONTO")) {
                dissemArr.push("FRONTO");
            }
            if (this.dissem.containsKey("KEYRUT")) {
                dissemArr.push("KEYRUT");
            }
            if (this.dissem.containsKey("SEABOOT")) {
                dissemArr.push("SEABOOT");
            }
            if (this.dissem.containsKey("SETTEE")) {
                dissemArr.push("SETTEE");
            }
            if (this.dissem.containsKey("DSEN")) {
                dissemArr.push("DEA SENSITIVE");
            }
            if (this.dissem.containsKey("FISA")) {
                dissemArr.push("FISA");
            }
            result += "//" + dissemArr.join("/");
        }

		if (this.fgi) {
			result += "//MR";
		} else if (this.declass && this.declass.length > 0) {
			result += "//" + this.declass;
		}

		this.classification = result;
	}

});
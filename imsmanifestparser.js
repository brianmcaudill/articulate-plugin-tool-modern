export class IMSManifestParser {
    constructor(filePath, config = {}) {
        this.filePath = filePath;
        this.links = [];
        this.resourceMap = {};
        this.scormVersion = null;

        // Configuration settings
        this.basePath = config.basePath || ""; // Default base path
        this.config = {
            studentId: config.studentId || "12345",
            studentName: config.studentName || "John Doe",
            courseId: config.courseId || "67890",
            debug: config.debug || false,
            ...config,
        };
    }

    async parse() {
        const response = await fetch(this.filePath);
        if (!response.ok) {
            throw new ManifestParsingError(`Failed to load file at ${this.filePath}: ${response.statusText}`);
        }

        const manifestXML = await response.text();
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(manifestXML, "application/xml");

        // Check for parsing errors
        const parseError = xmlDoc.getElementsByTagName("parsererror");
        if (parseError.length > 0) {
            throw new ManifestParsingError(`Error parsing XML: ${parseError[0].textContent}`);
        }

        this.logDebug("XML file successfully parsed.");
        this.scormVersion = this.getSCORMVersion(xmlDoc);
        this.logDebug(`SCORM version detected: ${this.scormVersion}`);

        this.buildResourceMap(xmlDoc);
        this.logDebug("Resource map constructed.");

        const rootItems = xmlDoc.getElementsByTagName("item");
        this.traverseItems(rootItems, -1);

        this.logDebug("Traversal complete.");
        return this.links;
    }

    getSCORMVersion(xmlDoc) {
        const metadata = xmlDoc.getElementsByTagName("metadata")[0];
        if (metadata) {
            const schemaVersion = metadata.getElementsByTagName("schemaVersion")[0];
            if (schemaVersion) {
                this.logDebug(`SCORM version found in schemaVersion: ${schemaVersion.textContent.trim()}`);
                return schemaVersion.textContent.trim();
            }
        }

        const manifest = xmlDoc.getElementsByTagName("manifest")[0];
        if (manifest) {
            const xmlnsDefault = manifest.getAttribute("xmlns");
            const xmlnsAdlcp = manifest.getAttribute("xmlns:adlcp");
            const schemaLocation = manifest.getAttribute("xsi:schemaLocation");

            if (
                (xmlnsDefault && xmlnsDefault.includes("v1p2")) ||
                (xmlnsAdlcp && xmlnsAdlcp.includes("v1p2")) ||
                (schemaLocation && schemaLocation.includes("v1p2"))
            ) {
                this.logDebug("SCORM version inferred from namespaces/schemaLocation: 1.2");
                return "1.2";
            }

            if (
                (xmlnsDefault && xmlnsDefault.includes("2004")) ||
                (xmlnsAdlcp && xmlnsAdlcp.includes("2004")) ||
                (schemaLocation && schemaLocation.includes("2004"))
            ) {
                this.logDebug("SCORM version inferred from namespaces/schemaLocation: 2004");
                return "2004";
            }
        }

        this.logDebug("SCORM version could not be determined. Defaulting to unknown.");
        return "unknown";
    }

    buildResourceMap(xmlDoc) {
        const resources = xmlDoc.getElementsByTagName("resource");
        Array.from(resources).forEach((resource) => {
            const id = resource.getAttribute("identifier");
            const href = resource.getAttribute("href");
            const scormType = resource.getAttribute("adlcp:scormtype");
            const metadata = {
                masteryscore: resource.getAttribute("adlcp:masteryscore"),
                timelimitaction: resource.getAttribute("adlcp:timelimitaction"),
                maxtimeallowed: resource.getAttribute("adlcp:maxtimeallowed"),
                datafromlms: resource.getAttribute("adlcp:datafromlms"),
            };

            if (id) {
                this.resourceMap[id] = { href: href || "", scormType, ...metadata };
            }
        });
    }

    traverseItems(items, parentIndex) {
        Array.from(items).forEach((item, index) => {
            const identifier = item.getAttribute("identifier");
            const identifierRef = item.getAttribute("identifierref");
            const titleNode = item.getElementsByTagName("title")[0];
            const title = titleNode ? titleNode.textContent.trim() : "Untitled";

            if (!identifierRef || !this.resourceMap[identifierRef]) {
                this.logDebug(`Skipping item due to missing resource for identifier: ${identifierRef}`);
                return;
            }

            const resource = this.resourceMap[identifierRef];
            const generatedLinks = this.generateLink(resource.href, resource);

            const link = {
                title,
                identifier,
                parentIndex,
                href: resource.href,
                scormType: resource.scormType,
                scormVersion: this.scormVersion,
                datafromlms: resource.datafromlms,
                masteryscore: resource.masteryscore,
                maxtimeallowed: resource.maxtimeallowed,
                timelimitaction: resource.timelimitaction,
                packageRelative: generatedLinks.packageRelative,
                serverRelative: generatedLinks.serverRelative,
            };

            this.links.push(link);
            this.logDebug(`Parsed item: ${link.title} (${link.identifier})`);

            const childItems = item.getElementsByTagName("item");
            if (childItems.length > 0) {
                this.traverseItems(childItems, index);
            }
        });
    }

    generateLink(href, resource = {}) {
        if (!href) return { packageRelative: null, serverRelative: null };

        const manifestBasePath = this.filePath.substring(0, this.filePath.lastIndexOf("/") + 1);
        let packageRelativePath ="";
        if(this.basePath != ""){
        packageRelativePath = `${this.basePath}/${href}`;
        }else{
            packageRelativePath = `${href}`;
        }
        const serverRelativePath = `${manifestBasePath}${packageRelativePath}`;
        const queryParams = new URLSearchParams({
            studentId: this.config.studentId,
            studentName: this.config.studentName,
            courseId: this.config.courseId,
            scormVersion: this.scormVersion || "unknown",
            masteryScore: resource.masteryscore || "",
        }).toString();

        return {
            packageRelative: `${this.encodePath(packageRelativePath)}?${queryParams}`,
            serverRelative: `${this.encodePath(serverRelativePath)}?${queryParams}`,
        };
    }

    encodePath(path) {
        return encodeURI(path).replace(/&/g, "%26").replace(/\?/g, "%3F");
    }

    logDebug(message) {
        if (this.config.debug) console.log(`[DEBUG]: ${message}`);
    }
}

// Error Classes
class ManifestParsingError extends Error {}
class SCORMVersionError extends Error {}

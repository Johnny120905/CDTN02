import os
import xml.etree.ElementTree as ET

M2_REPO = os.path.join(os.path.expanduser("~"), ".m2", "repository")
POM_NS = "{http://maven.apache.org/POM/4.0.0}"

props = {
    "selenium.version": "4.25.0",
    "testng.version": "7.10.2",
    "poi.version": "5.3.0",
    "restassured.version": "5.5.0",
}

def strip_ns(tag):
    return tag.split("}", 1)[-1]

def resolve_prop(val, local_props):
    if not val:
        return val
    for k, v in {**props, **local_props}.items():
        val = val.replace("${" + k + "}", v)
    return val

def parse_pom(pom_path):
    if not os.path.exists(pom_path):
        return [], {}
    tree = ET.parse(pom_path)
    root = tree.getroot()
    local_props = {}
    for el in root:
        if strip_ns(el.tag) == "properties":
            for p in el:
                local_props[strip_ns(p.tag)] = p.text.strip() if p.text else ""
        elif strip_ns(el.tag) == "version":
            local_props["project.version"] = el.text.strip() if el.text else ""
        elif strip_ns(el.tag) == "groupId":
            local_props["project.groupId"] = el.text.strip() if el.text else ""

    # Read dependencyManagement for BOM/Selenium versions
    dep_mgmt = {}
    for el in root:
        if strip_ns(el.tag) == "dependencyManagement":
            for deps in el:
                for dep in deps:
                    d = {strip_ns(c.tag): (c.text.strip() if c.text else "") for c in dep}
                    if d.get("groupId") and d.get("artifactId") and d.get("version"):
                        dep_mgmt[(d["groupId"], d["artifactId"])] = resolve_prop(d["version"], local_props)

    deps = []
    for el in root:
        if strip_ns(el.tag) == "dependencies":
            for dep in el:
                d = {strip_ns(c.tag): (c.text.strip() if c.text else "") for c in dep}
                scope = d.get("scope", "compile")
                opt = d.get("optional", "false")
                if scope in ("provided", "system") or opt == "true":
                    continue
                g = resolve_prop(d.get("groupId", ""), local_props)
                a = resolve_prop(d.get("artifactId", ""), local_props)
                v = resolve_prop(d.get("version", ""), local_props)
                if not v and (g, a) in dep_mgmt:
                    v = dep_mgmt[(g, a)]
                if g and a and v:
                    deps.append((g, a, v))
    return deps, local_props

visited = {}
queue = parse_pom(os.path.join(os.path.dirname(__file__), "pom.xml"))[0]

while queue:
    g, a, v = queue.pop(0)
    key = (g, a)
    if key in visited:
        continue
    art_dir = os.path.join(M2_REPO, *g.split("."), a, v)
    jar_path = os.path.join(art_dir, f"{a}-{v}.jar")
    pom_path = os.path.join(art_dir, f"{a}-{v}.pom")
    if os.path.exists(jar_path):
        visited[key] = jar_path
        sub_deps, _ = parse_pom(pom_path)
        for sd in sub_deps:
            if (sd[0], sd[1]) not in visited:
                queue.append(sd)

# Fallback scan for runtime dependencies of Selenium 4.25, POI 5.3, Jackson 2.17, TestNG 7.10
extra_known = [
    ("com.fasterxml.jackson.core", "jackson-core", "2.17.2"),
    ("com.fasterxml.jackson.core", "jackson-annotations", "2.17.2"),
    ("com.fasterxml.jackson.core", "jackson-databind", "2.17.2"),
    ("org.apache.poi", "poi", "5.3.0"),
    ("org.apache.poi", "poi-ooxml", "5.3.0"),
    ("org.apache.poi", "poi-ooxml-lite", "5.3.0"),
    ("org.apache.xmlbeans", "xmlbeans", "5.2.1"),
    ("org.apache.commons", "commons-compress", "1.26.2"),
    ("org.apache.commons", "commons-collections4", "4.4"),
    ("org.apache.commons", "commons-math3", "3.6.1"),
    ("org.apache.commons", "commons-exec", "1.4.0"),
    ("org.apache.commons", "commons-lang3", "3.14.0"),
    ("commons-codec", "commons-codec", "1.17.0"),
    ("commons-io", "commons-io", "2.16.1"),
    ("com.github.virtuald", "curvesapi", "1.08"),
    ("com.zaxxer", "SparseBitSet", "1.3"),
    ("org.apache.logging.log4j", "log4j-api", "2.23.1"),
    ("org.slf4j", "slf4j-api", "2.0.16"),
    ("com.beust", "jcommander", "1.82"),
    ("org.jcommander", "jcommander", "1.83"),
    ("org.webjars", "jquery", "3.7.1"),
    ("com.google.guava", "guava", "33.3.0-jre"),
    ("com.google.guava", "failureaccess", "1.0.2"),
    ("com.google.code.gson", "gson", "2.10.1"),
    ("io.opentelemetry", "opentelemetry-api", "1.42.1"),
    ("io.opentelemetry", "opentelemetry-context", "1.42.1"),
    ("io.opentelemetry", "opentelemetry-sdk", "1.42.1"),
    ("io.opentelemetry", "opentelemetry-sdk-common", "1.42.1"),
    ("io.opentelemetry", "opentelemetry-sdk-trace", "1.42.1"),
    ("io.opentelemetry", "opentelemetry-sdk-metrics", "1.42.1"),
    ("io.opentelemetry", "opentelemetry-sdk-logs", "1.42.1"),
    ("io.opentelemetry", "opentelemetry-exporter-logging", "1.42.1"),
    ("io.opentelemetry", "opentelemetry-sdk-extension-autoconfigure", "1.42.1"),
    ("io.opentelemetry", "opentelemetry-sdk-extension-autoconfigure-spi", "1.42.1"),
    ("io.opentelemetry.semconv", "opentelemetry-semconv", "1.26.0-alpha"),
    ("net.bytebuddy", "byte-buddy", "1.15.3"),
    ("dev.failsafe", "failsafe", "3.3.2"),
]
for g, a, v in extra_known:
    if (g, a) not in visited:
        p = os.path.join(M2_REPO, *g.split("."), a, v, f"{a}-{v}.jar")
        if os.path.exists(p):
            visited[(g, a)] = p
        else:
            # pick newest available version in m2
            base_art = os.path.join(M2_REPO, *g.split("."), a)
            if os.path.isdir(base_art):
                vers = sorted(os.listdir(base_art))
                if vers:
                    vv = vers[-1]
                    pp = os.path.join(base_art, vv, f"{a}-{vv}.jar")
                    if os.path.exists(pp):
                        visited[(g, a)] = pp

# Ensure all selenium-* 4.25.0 jars present if any were skipped
sel_dir = os.path.join(M2_REPO, "org", "seleniumhq", "selenium")
for art in os.listdir(sel_dir):
    p = os.path.join(sel_dir, art, "4.25.0", f"{art}-4.25.0.jar")
    if os.path.exists(p) and ("org.seleniumhq.selenium", art) not in visited:
        visited[("org.seleniumhq.selenium", art)] = p

# Remove duplicate test-only / legacy versions cleanly
cp = os.pathsep.join(visited.values())
print(cp)

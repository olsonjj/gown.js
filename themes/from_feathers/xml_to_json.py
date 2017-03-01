import os
import xml.etree.ElementTree as ET
import json
import argparse
from PIL import Image


def sprite_data(attrib):
    return {
        "frame": {
            "x": int(attrib['x']),
            "y": int(attrib['y']),
            "w": int(attrib['width']),
            "h": int(attrib['height'])
        },
        "rotated": False,
        "trimmed": False,
        "spriteSourceSize": {
            "x": 0,
            "y": 0,
            "w": int(attrib['width']),
            "h": int(attrib['height'])
        },
        "sourceSize": {
            "w": int(attrib['width']),
            "h": int(attrib['height'])
        }
    }


def parse_xml(filename):
    tree = ET.parse(filename)
    root = tree.getroot()
    data = {}
    for child in root:
        data[child.attrib['name']] = sprite_data(child.attrib)
    return root, data


def image_meta(filename):
    im = Image.open(filename)
    return {
        "version": "1.0",
        "image": os.path.split(filename)[1],
        "size": {
            "w": im.size[0],
            "h": im.size[1]
        }
    }


def get_data(path):
    base_path = os.path.split(path)[0]
    root, frames = parse_xml(path)
    meta = image_meta(os.path.join(base_path, root.attrib['imagePath']))
    return {"frames": frames, "meta": meta}



def convert(path):
    theme_path = os.path.splitext(path)[0]
    with open(theme_path + '.json', 'w') as json_file:
        json.dump(get_data(path), json_file, indent=2, sort_keys=True)
    return theme_path


def main():
    parser = argparse.ArgumentParser(
        description='Convert XML theme from feathers to XML for gown.js.')
    parser.add_argument('path', type=str,
                        help='path to xml file')
    args = parser.parse_args()
    convert(args.path)


if __name__ == '__main__':
    main()

"""Compatibility entry point: render the current acoustic audio with --soundfont.

The original synthesized celebration has been replaced by the chamber version.
Uses the same arguments and verified sources as generate-cozy-audio.py.
"""
import runpy
from pathlib import Path

runpy.run_path(str(Path(__file__).with_name('generate-cozy-audio.py')), run_name='__main__')

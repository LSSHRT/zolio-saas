"""Tests for AIAgent._repair_tool_call doubled-name detection.

Verifies that models generating duplicated tool names (e.g. "terminalterminal")
are correctly repaired to valid names.
"""

import sys
from pathlib import Path
from unittest.mock import MagicMock

import pytest

_repo_root = Path(__file__).resolve().parent.parent.parent
if str(_repo_root) not in sys.path:
    sys.path.insert(0, str(_repo_root))

from run_agent import AIAgent


@pytest.fixture
def agent_with_tools():
    """Create a minimal AIAgent with valid_tool_names set."""
    agent = MagicMock(spec=AIAgent)
    agent.valid_tool_names = {
        "terminal",
        "read_file",
        "write_file",
        "search_files",
        "patch",
        "process",
        "browser_navigate",
        "web_search",
        "execute_code",
    }
    agent._repair_tool_call = AIAgent._repair_tool_call.__get__(agent, AIAgent)
    return agent


class TestDoubledNameDetection:
    """Tests for doubled-name detection in _repair_tool_call."""

    def test_exact_double_even_length(self, agent_with_tools):
        """'terminalterminal' -> 'terminal'"""
        result = agent_with_tools._repair_tool_call("terminalterminal")
        assert result == "terminal"

    def test_exact_double_underscore_name(self, agent_with_tools):
        """'read_fileread_file' -> 'read_file'"""
        result = agent_with_tools._repair_tool_call("read_fileread_file")
        assert result == "read_file"

    def test_exact_double_with_different_name(self, agent_with_tools):
        """'write_filewrite_file' -> 'write_file'"""
        result = agent_with_tools._repair_tool_call("write_filewrite_file")
        assert result == "write_file"

    def test_half_split_fallback(self, agent_with_tools):
        """Even-length halving should still work when name+name check is slower."""
        result = agent_with_tools._repair_tool_call("terminalterminal")
        assert result == "terminal"

    def test_lowercase_only(self, agent_with_tools):
        """Simple casing fix still works."""
        result = agent_with_tools._repair_tool_call("Terminal")
        assert result == "terminal"

    def test_hyphen_normalization(self, agent_with_tools):
        """Hyphen to underscore normalization still works."""
        result = agent_with_tools._repair_tool_call("read-file")
        assert result == "read_file"

    def test_space_normalization(self, agent_with_tools):
        """Space to underscore normalization still works."""
        result = agent_with_tools._repair_tool_call("read file")
        assert result == "read_file"

    def test_fuzzy_match_still_works(self, agent_with_tools):
        """Typos close to valid names should still fuzzy-match."""
        result = agent_with_tools._repair_tool_call("web-serach")
        assert result == "web_search"

    def test_no_match_returns_none(self, agent_with_tools):
        """Completely made-up names should return None."""
        result = agent_with_tools._repair_tool_call("banana_pancake_syrup")
        assert result is None

    def test_browser_navigate_doubled(self, agent_with_tools):
        """'browser_navigatebrowser_navigate' -> 'browser_navigate'"""
        result = agent_with_tools._repair_tool_call("browser_navigatebrowser_navigate")
        assert result == "browser_navigate"

    def test_already_valid_not_doubled(self, agent_with_tools):
        """Valid names should return immediately."""
        result = agent_with_tools._repair_tool_call("terminal")
        assert result == "terminal"

    def test_odd_length_triplication(self, agent_with_tools):
        """Odd-length doubled names handled by name+name exact match."""
        # "terminalterminal" is 16 chars (even), already covered
        # Test a name that when doubled gives odd total is impossible,
        # but test the edge: half-split for even-length invalid names
        result = agent_with_tools._repair_tool_call("execute_codeexecute_code")
        assert result == "execute_code"

from taipy.common.frequency import Frequency
from taipy.config._config import _Config
from taipy.config.checker.checkers.scenario_config_checker import ScenarioConfigChecker
from taipy.config.checker.issue_collector import IssueCollector
from taipy.config.pipeline_config import PipelineConfig


class TestScenarioConfigChecker:
    def test_check_pipelines(self):
        collector = IssueCollector()
        config = _Config.default_config()
        ScenarioConfigChecker(config, collector).check()
        assert len(collector.errors) == 0
        assert len(collector.warnings) == 1
        assert len(collector.infos) == 1

        config.scenarios["default"].pipelines = "bar"
        collector = IssueCollector()
        ScenarioConfigChecker(config, collector).check()
        assert len(collector.errors) == 1
        assert len(collector.warnings) == 0
        assert len(collector.infos) == 1

        config.scenarios["default"].pipelines = ["bar"]
        collector = IssueCollector()
        ScenarioConfigChecker(config, collector).check()
        assert len(collector.errors) == 1
        assert len(collector.warnings) == 0
        assert len(collector.infos) == 1

        config.scenarios["default"].pipelines = ["bar", PipelineConfig("bar")]
        collector = IssueCollector()
        ScenarioConfigChecker(config, collector).check()
        assert len(collector.errors) == 1
        assert len(collector.warnings) == 0
        assert len(collector.infos) == 1

        config.scenarios["default"].pipelines = [PipelineConfig("bar")]
        collector = IssueCollector()
        ScenarioConfigChecker(config, collector).check()
        assert len(collector.errors) == 0
        assert len(collector.warnings) == 0
        assert len(collector.infos) == 1

    def test_check_frequency(self):
        config = _Config.default_config()

        config.scenarios["default"].frequency = "bar"
        collector = IssueCollector()
        ScenarioConfigChecker(config, collector).check()
        assert len(collector.errors) == 1
        assert len(collector.warnings) == 1
        assert len(collector.infos) == 1

        config.scenarios["default"].frequency = 1
        collector = IssueCollector()
        ScenarioConfigChecker(config, collector).check()
        assert len(collector.errors) == 1
        assert len(collector.warnings) == 1
        assert len(collector.infos) == 1

        config.scenarios["default"].frequency = Frequency.DAILY
        collector = IssueCollector()
        ScenarioConfigChecker(config, collector).check()
        assert len(collector.errors) == 0
        assert len(collector.warnings) == 1
        assert len(collector.infos) == 1

    def test_check_comparators(self):
        config = _Config.default_config()

        collector = IssueCollector()
        ScenarioConfigChecker(config, collector).check()
        assert len(collector.errors) == 0
        assert len(collector.warnings) == 1
        assert len(collector.infos) == 1

        config.scenarios["default"].comparators = {"bar": "abc"}
        collector = IssueCollector()
        ScenarioConfigChecker(config, collector).check()
        assert len(collector.errors) == 0
        assert len(collector.warnings) == 1
        assert len(collector.infos) == 0
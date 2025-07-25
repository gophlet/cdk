'use client';

import {useState, useEffect, useCallback, useMemo} from 'react';
import {useRouter} from 'next/navigation';
import {Skeleton} from '@/components/ui/skeleton';
import {ExploreContent} from './ExploreContent';
import {ExploreBanner} from './ExploreBanner';
import services from '@/lib/services';
import {ProjectListItem} from '@/lib/services/project/types';
import {motion} from 'motion/react';

const PAGE_SIZE = 24;

/**
 * 加载骨架屏组件
 */
const LoadingSkeleton = () => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
    {[0, 1, 2, 3, 4, 5, 6, 7].map((index) => (
      <div key={`skeleton-fixed-${index}`} className="w-full max-w-sm mx-auto">
        <div className="bg-gray-200 dark:bg-gray-800 p-4 sm:p-6 rounded-2xl relative">
          <div className="absolute top-2 left-2 sm:top-3 sm:left-3 flex gap-1 sm:gap-2">
            <Skeleton className="h-3 w-3 sm:h-4 sm:w-4 rounded-full" />
            <Skeleton className="h-3 w-8 sm:h-4 sm:w-10 rounded" />
          </div>
          <div className="flex flex-col items-center justify-center h-28 sm:h-32">
            <Skeleton className="h-4 sm:h-6 w-2/3 bg-white/30 dark:bg-gray-600 rounded" />
          </div>
        </div>
        <div className="space-y-1.5 sm:space-y-2 mt-3">
          <Skeleton className="h-3 sm:h-4 w-2/3 rounded" />
          <Skeleton className="h-3 w-full rounded" />
        </div>
      </div>
    ))}
  </div>
);

/**
 * 探索广场主组件
 */
export function ExploreMain() {
  const router = useRouter();
  const [allProjects, setAllProjects] = useState<ProjectListItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [tags, setTags] = useState<string[]>([]);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [tagSearchKeyword, setTagSearchKeyword] = useState('');
  const [isTagFilterOpen, setIsTagFilterOpen] = useState(false);
  const [showAllTags, setShowAllTags] = useState(false);
  const [isClient, setIsClient] = useState(false);

  // 确保客户端渲染
  useEffect(() => {
    setIsClient(true);
  }, []);

  /**
   * 判断项目是否为活跃状态的工具函数
   */
  const isActiveProject = useCallback((project: ProjectListItem) => {
    const now = new Date();
    const startTime = new Date(project.start_time);
    const endTime = new Date(project.end_time);
    return now >= startTime && now <= endTime && project.total_items > 0;
  }, []);

  /**
   * 判断项目是否即将开始的工具函数
   */
  const isUpcomingProject = useCallback((project: ProjectListItem) => {
    const now = new Date();
    const startTime = new Date(project.start_time);
    return startTime > now && project.total_items > 0;
  }, []);

  /**
   * 所有活跃项目（不受筛选影响，用于特色项目选择）
   */
  const allActiveProjects = useMemo(() => {
    return (allProjects || []).filter(isActiveProject);
  }, [allProjects, isActiveProject]);

  // 使用稳定的排序方式选择特色项目，避免使用Math.random()
  // 特色项目不受搜索和筛选影响
  const featuredProjects = useMemo(() => {
    if (!allActiveProjects?.length) return [];

    // 使用稳定的排序方式：按项目ID进行稳定排序，取前5个
    return [...allActiveProjects]
        .sort((a, b) => a.id.localeCompare(b.id))
        .slice(0, 5);
  }, [allActiveProjects]);

  /**
   * 项目过滤和分类逻辑
   */
  const processedData = useMemo(() => {
    /**
     * 注意：现在搜索和标签筛选都由后端处理
     * 前端只需要对已筛选的数据进行分类
     */
    const activeProjects = allProjects.filter(isActiveProject);
    const upcomingList = allProjects.filter(isUpcomingProject);

    /** 即将开始项目 */
    const upcomingProjects = upcomingList
        .sort(
            (a, b) =>
              new Date(a.start_time).getTime() - new Date(b.start_time).getTime(),
        )
        .slice(0, 6);

    return {
      activeProjects,
      upcomingProjects,
      total: totalCount, // 使用后端返回的总数
    };
  }, [allProjects, totalCount, isActiveProject, isUpcomingProject]);

  /**
   * 获取项目列表
   */
  const fetchProjects = useCallback(async () => {
    setLoading(true);

    const result = await services.project.getProjectsSafe({
      current: currentPage,
      size: PAGE_SIZE,
      tags: (selectedTags || []).length > 0 ? selectedTags : undefined,
      search: searchKeyword.trim() || undefined,
    });

    if (result.success && result.data) {
      setAllProjects(result.data.results || []);
      setTotalCount(result.data.total || 0);
    } else {
      setAllProjects([]);
      setTotalCount(0);
    }

    setLoading(false);
  }, [currentPage, selectedTags, searchKeyword]);

  /**
   * 获取标签列表
   */
  const fetchTags = useCallback(async () => {
    const result = await services.project.getTagsSafe();
    if (result.success) {
      setTags(result.tags || []);
    }
  }, []);

  /**
   * 处理标签选择
   */
  const handleTagToggle = (tag: string) => {
    setSelectedTags((prev) => {
      const prevTags = prev || [];
      const newTags =
        tag === '' ?
          [] :
          prevTags.includes(tag) ?
            prevTags.filter((t) => t !== tag) :
            [...prevTags, tag];

      setCurrentPage(1);
      setShowAllTags(false);
      return newTags;
    });
  };

  /**
   * 处理页面变化
   */
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // 滚动到页面顶部
    window.scrollTo({top: 0, behavior: 'smooth'});
  };

  /**
   * 处理搜索提交
   */
  const handleSearchSubmit = () => {
    setCurrentPage(1);
  };

  /**
   * 卡片点击事件
   */
  const handleCardClick = (project: ProjectListItem) => {
    router.push(`/receive/${project.id}`);
  };

  /**
   * 清除筛选条件
   */
  const clearAllFilters = () => {
    setSelectedTags([]);
    setSearchKeyword('');
    setCurrentPage(1);
    setShowAllTags(false);
  };

  /** 数据获取 */
  useEffect(() => {
    fetchTags();
  }, [fetchTags]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  // 如果还没有客户端渲染，显示加载状态
  if (!isClient) {
    return <LoadingSkeleton />;
  }

  const containerVariants = {
    hidden: {opacity: 0},
    visible: {
      opacity: 1,
      transition: {
        duration: 0.5,
        staggerChildren: 0.1,
        ease: 'easeOut',
      },
    },
  };

  const contentVariants = {
    hidden: {opacity: 0, y: 30},
    visible: {
      opacity: 1,
      y: 0,
      transition: {duration: 0.8, ease: 'easeOut'},
    },
  };

  return (
    <motion.div
      className="space-y-6"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <motion.div variants={contentVariants}>
        <ExploreBanner
          randomProjects={featuredProjects}
          onProjectClick={handleCardClick}
        />
        <ExploreContent
          data={{
            projects: allProjects,
            upcomingProjects: processedData.upcomingProjects,
            total: processedData.total,
            currentPage,
            tags,
            selectedTags,
            searchKeyword,
            tagSearchKeyword,
            isTagFilterOpen,
            showAllTags,
            loading,
            onPageChange: handlePageChange,
            onTagToggle: handleTagToggle,
            onSearchSubmit: handleSearchSubmit,
            onCardClick: handleCardClick,
            onClearAllFilters: clearAllFilters,
            onSearchKeywordChange: setSearchKeyword,
            onTagSearchKeywordChange: setTagSearchKeyword,
            onTagFilterOpenChange: setIsTagFilterOpen,
            onShowAllTagsChange: setShowAllTags,
          }}
          LoadingSkeleton={LoadingSkeleton}
          pageSize={PAGE_SIZE}
        />
      </motion.div>
    </motion.div>
  );
}

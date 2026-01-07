package com.niuniu.pojo.controller;

import cn.hutool.core.io.IoUtil;
import com.niuniu.pojo.User;
import org.springframework.web.bind.annotation.*;

import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api")
@CrossOrigin
public class UserController {

    @GetMapping("/test")
    public String test() {
        return "研究生信息管理系统API运行正常！当前时间：" + LocalDateTime.now();
    }

    @GetMapping("/health")
    public String health() {
        return "{\"status\": \"UP\", \"timestamp\": \"" + LocalDateTime.now() + "\"}";
    }

    @GetMapping("/users")
    public List<User> getUsers() {
        System.out.println("=== 开始读取研究生数据库（精简版）===");

        List<User> userList = new ArrayList<>();

        try {
            // 读取数据库文件
            InputStream in = this.getClass().getClassLoader().getResourceAsStream("user.txt");

            if (in == null) {
                System.out.println("错误：数据库文件user.txt未找到");
                return createSampleData();
            }

            // 读取所有行
            List<String> lines = IoUtil.readLines(in, StandardCharsets.UTF_8, new ArrayList<>());
            System.out.println("成功读取到 " + lines.size() + " 条记录");

            int lineCount = 0;
            int successCount = 0;

            for (String line : lines) {
                lineCount++;
                line = line.trim();

                if (line.isEmpty()) {
                    continue;
                }

                try {
                    // 分割字段
                    String[] parts = line.split(",");

                    if (parts.length < 16) {
                        System.out.println("警告：第 " + lineCount + " 行字段不足(" + parts.length + ")，跳过: " + line.substring(0, Math.min(line.length(), 50)) + "...");
                        continue;
                    }

                    // 解析各个字段
                    int id = parseInt(parts[0]);
                    String username = parts[1];
                    String studentId = parts[2];
                    String name = parts[3];
                    int age = parseInt(parts[4]);
                    String gender = parts[5];
                    String email = parts[6];
                    String phone = parts[7];
                    String major = parts[8];
                    String advisor = parts[9];
                    String grade = parts[10];
                    String status = parts[11];
                    String enrollmentDate = parts[12];
                    String expectedGraduation = parts[13];
                    double gpa = parseDouble(parts[14]);
                    LocalDateTime updateTime = parseDateTime(parts[15]);

                    // 创建User对象
                    User user = new User(id, username, studentId, name, age, gender, email, phone,
                            major, advisor, grade, status, enrollmentDate,
                            expectedGraduation, gpa, updateTime);

                    userList.add(user);
                    successCount++;

                    if (successCount <= 3) {
                        System.out.println("成功解析记录 " + successCount + ": " + name + " (" + studentId + ")");
                    }

                } catch (Exception e) {
                    System.out.println("解析第 " + lineCount + " 行失败: " + e.getMessage());
                    System.out.println("行内容: " + line.substring(0, Math.min(line.length(), 100)));
                }
            }

            System.out.println("=== 数据库读取完成 ===");
            System.out.println("总行数: " + lineCount);
            System.out.println("成功解析: " + successCount);
            System.out.println("失败: " + (lineCount - successCount));

            if (userList.isEmpty()) {
                System.out.println("没有解析到有效数据，返回示例数据");
                return createSampleData();
            }

            return userList;

        } catch (Exception e) {
            System.out.println("读取数据库文件发生异常: " + e.getMessage());
            e.printStackTrace();
            return createSampleData();
        }
    }

    private int parseInt(String str) {
        try {
            return Integer.parseInt(str.trim());
        } catch (Exception e) {
            return 0;
        }
    }

    private double parseDouble(String str) {
        try {
            return Double.parseDouble(str.trim());
        } catch (Exception e) {
            return 0.0;
        }
    }

    private LocalDateTime parseDateTime(String dateStr) {
        dateStr = dateStr.trim();

        // 尝试多种日期格式
        String[] formats = {
                "yyyy-MM-dd HH:mm:ss",
                "yyyy/MM/dd HH:mm:ss",
                "yyyy.MM.dd HH:mm:ss"
        };

        for (String format : formats) {
            try {
                return LocalDateTime.parse(dateStr, DateTimeFormatter.ofPattern(format));
            } catch (Exception e) {
                // 继续尝试下一个格式
            }
        }

        // 如果所有格式都失败，使用当前时间
        System.out.println("无法解析日期: " + dateStr + "，使用当前时间");
        return LocalDateTime.now();
    }

    // 创建示例数据（当数据库读取失败时使用）
    private List<User> createSampleData() {
        List<User> sampleList = new ArrayList<>();

        sampleList.add(new User(1, "test1", "20231001", "测试学生1", 22, "男",
                "test1@university.edu", "13800000001", "计算机科学与技术",
                "张教授", "研一", "在读", "2024-09-01", "2027-06-30",
                3.5, LocalDateTime.now()));

        sampleList.add(new User(2, "test2", "20231002", "测试学生2", 24, "女",
                "test2@university.edu", "13800000002", "软件工程",
                "李教授", "研二", "在读", "2023-09-01", "2026-06-30",
                3.7, LocalDateTime.now()));

        return sampleList;
    }

    // 新增：获取专业统计信息
    @GetMapping("/stats/majors")
    public List<Object> getMajorStats() {
        List<User> users = getUsers();

        // 统计各个专业的人数
        List<Object> result = new ArrayList<>();
        // 这里可以添加专业统计逻辑

        return result;
    }
}